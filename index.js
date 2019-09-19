const minimist = require('minimist')
const isObject = require('lodash.isplainobject')
const isFunction = require('lodash.isfunction')
const fs = require('fs')
const chalk = require('chalk')
const stringSimilarity = require('string-similarity')
const fclone = require('fclone')
const { AutoComplete, prompt } = require('enquirer')

class CommandNotFoundError extends Error {
  constructor(message) {
    super(message)
    this.name = 'CommandNotFound'
  }
}

const functionExists = obj => {
  if (isFunction(obj)) {
    return true
  }

  if (isObject(obj)) {
    const res = getProps(obj).filter(key => {
      if (isFunction(obj[key])) {
        return true
      }

      if (isObject(obj[key])) {
        return functionExists(obj[key])
      }

      return false
    })

    if (res.length > 0) {
      return true
    }
  }

  return false
}

const last = arr => {
  return arr[arr.length - 1]
}

const getProps = instance => {
  const keys = Object.keys(instance)
    .filter(k => k != '__description__')
    .filter(k => !k.startsWith('_'))
    .filter(k => functionExists(instance[k]))
    .sort()

  return keys
}

const introspect = fn => {
  // returns array of args if there is a default arg it returns it with array of arrays:
  // eg [arg1, [arg2, <default>], arg3]

  if (typeof fn === 'function') {
    const argumentsRegExp = /\((.+)\)|^[^=>]+(?=\b\s=>)/
    const firstLine = fn.toString().match(/^.*$/m)

    if (firstLine.length < 0) {
      return []
    }
    const res = argumentsRegExp.exec(firstLine)

    return res
      ? res[0]
          // replace comments and parenthesis
          .replace(/(\/\*[\s\S]*?\*\/|\(|\))/gm, '')
          // replace async keyword
          .replace(/async /gm, '')
          .split(',')
          .map(s => {
            try {
              if (s.includes('=')) {
                const param = s.split('=')
                return [param[0].trim(), eval(param[1])]
              }
              return s.trim()
            } catch (err) {
              throw err
              return []
            }
          })
      : []
  } else {
    throw new TypeError('NOT_A_FUNCTION')
  }
}

const scrapeComments = input => {
  if (input['__description__']) {
    return input['__description__']
  }

  // https://github.com/sindresorhus/comment-regex
  const line = () => /(?:^|\s)\/\/(.+?)$/gms
  const block = () => /\/\*(.*?)\*\//gms

  const comment = new RegExp(
    `(?:${line().source})|(?:${block().source})`,
    'gms',
  )

  if (!input.toString) {
    return
  }

  const m = input.toString().match(comment)
  if (m) {
    return m[0]
  }
  return
}

const isTargetCmd = (argv, key) => {
  return key === last(argv._)
}

const isInteractive = argv => (argv['interactive'] || argv['i'] ? true : false)
const isHelp = argv => (argv['help'] || argv['h'] ? true : false)

const usageText = () => {
  const cwd = process.cwd()
  const fullArgs = minimist(process.argv)
  const stats = fs.lstatSync(fullArgs._[1])
  let subcommands = fullArgs._

  if (stats.isSymbolicLink()) {
    // Probably is a better way to test if it's a linked bin
    // but isSymbolicLink seems to work for now.
    // this removes node if the second lib
    subcommands = subcommands.slice(1)
  }

  subcommands = subcommands.map(c => c.split('/').pop())

  return `USAGE:\n\t${subcommands.join(' ')}`
}

const flagsText = args => {
  if (args.length > 0) {
    return args
      .map(arg => {
        if (Array.isArray(arg)) {
          return ' --' + arg[0] + '=' + arg[1] + ' '
        }

        return ' --' + arg + '=<' + arg + '>' + ' '
      })
      .join('')
  }
  return ''
}

const parseFn = argv => async (fn, offset = 0) => {
  const args = introspect(fn)
  const values = args.map((name, i) => {
    if (Array.isArray(name)) {
      if (argv[name[0]]) {
        return argv[name[0]]
      }
    }

    if (argv[name]) {
      return argv[name]
    }

    return argv['_'][offset + i]
  })

  return Promise.resolve(fn(...values))
}

const functionHelp = (fn, name, depth = 1) => {
  const args = introspect(fn)
  return (
    '\t'.repeat(depth) +
    (name ? name : fn.name) +
    ' <flags>' +
    flagsText(args) +
    '\n'
  )
}

const subcommandHelp = (input, depth = 1) => {
  return getProps(input).reduce((acc, key) => {
    if (isObject(input[key])) {
      acc = acc + '\n\t' + key + '\n' + subcommandHelp(input[key], depth + 1)
      return acc
    }

    if (isFunction(input[key])) {
      acc = acc + '\t'.repeat(depth) + functionHelp(input[key], key)
    }

    return acc
  }, '')
}

const getSubCommands = input => {
  return getProps(input).reduce((acc, key) => {
    let description = scrapeComments(input[key]) || ''
    acc.push({
      key,
      instance: input[key],
    })
    return acc
  }, [])
}

const getFlagsInput = async flags => {
  if (flags.length == 0) {
    return []
  }

  const flagsInput = flags.map(flag => {
    if (Array.isArray(flag)) {
      return {
        name: `--${flag[0]}`,
        type: 'input',
        initial: `${flag[1]}`,
      }
    }

    return {
      name: `--${flag}`,
      type: 'input',
    }
  })

  const res = await prompt(flagsInput)
  return flags.map(f => {
    if (Array.isArray(f)) {
      return res[`--${f[0]}`]
    }
    return res[`--${f}`]
  })
}

const handleFunction = argv => async (fn, name, offset = 0) => {
  if (isInteractive(argv) && isTargetCmd(argv, name)) {
    const args = introspect(fn)
    const values = await getFlagsInput(args)
    const result = await fn(...values)
    return result
  }

  if (isHelp(argv) && isTargetCmd(argv, name)) {
    const description = scrapeComments(fn)
    return (
      usageText() +
      flagsText(introspect(fn)) +
      (description ? '\n\nDESCRIPTION: ' + '\n' + description + '\n' : '')
    )
  }

  // if there is a name
  // it means this is a subcommand so let's
  // shift the argv
  if (name) {
    const cmdIndex = process.argv.findIndex(item => item === name)
    return parseFn(minimist(process.argv.slice(cmdIndex)))(fn, offset)
  }

  return parseFn(argv)(fn, offset)
}

const getSuggestion = async subcommands => {
  const prompt = new AutoComplete({
    name: 'Subcommand',
    message: 'Select a command',
    limit: 100,
    choices: subcommands.map(cmd => cmd.key),
  })

  const answer = await prompt.run()

  return subcommands.find(cmd => cmd.key == answer)
}

const cmdNotFound = (argv, props) => {
  if (argv._.length === 0) {
    return chalk.red(`Error: Command not found\n\n`)
  }

  const match = stringSimilarity.findBestMatch(last(argv._), props).bestMatch

  return (
    chalk.red(
      `Error: Command ${chalk.red.underline(last(argv._))} not found\n`,
    ) +
    (match.rating > 0.6
      ? chalk.yellow(`Did you mean: ${chalk.yellow.underline(match.target)} ?`)
      : '') +
    '\n\n'
  )
}

const handleObject = argv => async input => {
  // find object in question (derived from argv)
  const [keys, method] = argv._.reduce(
    ([ks, m], arg, i) => {
      if (getProps(m).includes(arg)) {
        return [[...ks, arg], m[arg]]
      }
      return [ks, m]
    },
    [[], input],
  )

  if (isFunction(method)) {
    return handleFunction(argv)(method, keys[keys.length - 1], keys.length)
  }

  if (isInteractive(argv)) {
    const subcommands = getSubCommands(method)
    const cmd = await getSuggestion(subcommands)
    // adjust the argv with interactive
    argv._.push(cmd.key)

    if (isFunction(cmd.instance)) {
      return handleFunction(argv)(cmd.instance, cmd.instance.name, keys.length)
    }

    return fire(argv)(cmd.instance)
  }

  const description = scrapeComments(method)
  const cmdHelpText = subcommandHelp(method, 0)

  if (isHelp(argv)) {
    return (
      cmdNotFound(argv, getProps(method)) +
      usageText() +
      (description ? '\n\nDESCRIPTION: ' + '\n\t' + description + '\n' : '') +
      '\n\nCOMMANDS:\n\n' +
      cmdHelpText
    )
  }

  // this means that the caller tried to call an object
  throw new CommandNotFoundError(
    cmdNotFound(argv, getProps(method)) +
      usageText() +
      (description ? '\n\nDESCRIPTION: ' + '\n\t' + description + '\n' : '') +
      '\n\nCOMMANDS:\n\n' +
      cmdHelpText,
  )
}

const fire = argv => input => {
  if (isFunction(input)) {
    return handleFunction(argv)(input)
  }

  if (isObject(input)) {
    const cleansed = fclone(input)

    return handleObject(argv)(cleansed)
  }

  throw TypeError('js-fire can only handle functions or objects')
}

const print = data => {
  if (data == null) {
    // Hide the response from stdout if it's undefined || null
    return
  }
  console.log(String(data).trim())
}

module.exports = input => {
  const argv = minimist(process.argv.slice(2))

  fire(argv)(input)
    .then(print)
    .catch(err => {
      if (err instanceof CommandNotFoundError) {
        console.log(err.message)
        process.exit(1)
        return
      }
      process.exit(1)
      console.log(err)
    })
}
