const argv = require('minimist')(process.argv.slice(2))
const isObject = require('lodash.isplainobject')
const isFunction = require('lodash.isfunction')
const autocompletePrompt = require('cli-autocomplete')
const textPrompt = require('text-prompt')

const introspect = fn => {
  // returns array of args if there is a default arg it returns it with array of arrays:
  // eg [arg1, [arg2, <default>], arg3]

  if (typeof fn === 'function') {
    const argumentsRegExp = /\((.+)\)|^[^=>]+(?=\b\s=>)/
    const res = argumentsRegExp.exec(fn.toString())

    return res
      ? res[0]
          // replace comments and parenthesis
          .replace(/(\/\*[\s\S]*?\*\/|\(|\))/gm, '')
          .split(',')
          .map(s => {
            if (s.includes('=')) {
              const param = s.split('=')
              return [param[0].trim(), eval(param[1])]
            }
            return s.trim()
          })
      : []
  } else {
    throw new TypeError('NOT_A_FUNCTION')
  }
}

const scrapeComments = input => {
  // https://github.com/sindresorhus/comment-regex
  const line = () => /(?:^|\s)\/\/(.+?)$/gms
  const block = () => /\/\*(.*?)\*\//gms

  const comment = new RegExp(
    `(?:${line().source})|(?:${block().source})`,
    'gms',
  )

  const m = input.toString().match(comment)
  if (m) {
    return m[0]
  }
  return
}

const isInteractive = argv => (argv['interactive'] || argv['i'] ? true : false)
const isHelp = argv => (argv['help'] || argv['h'] ? true : false)
const hasNoCmd = argv => argv._.length == 0

const usageText = subcommand => {
  const splitArgs = process.argv[1].split('/')
  const cmd = splitArgs[splitArgs.length - 1]

  return `USAGE:\n\tnode ${cmd} ${subcommand ? subcommand : ''}`
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

const functionHelp = (fn, depth = 1) => {
  const args = introspect(fn)
  return '\t'.repeat(depth) + fn.name + ' <flags>' + flagsText(args) + '\n'
}

const subcommandHelp = (input, depth = 1) => {
  return Object.getOwnPropertyNames(input).reduce((acc, key) => {
    if (isObject(input[key])) {
      acc = acc + '\n\t' + key + '\n' + subcommandHelp(input[key], depth + 1)
      return acc
    }

    if (isFunction(input[key])) {
      acc = acc + '\t'.repeat(depth) + functionHelp(input[key])
    }
    return acc
  }, '')
}

const getSubCommands = input => {
  return Object.getOwnPropertyNames(input).reduce((acc, key) => {
    let description = scrapeComments(input[key]) || ''
    acc.push({ title: key + '\t' + description, value: input[key] })
    return acc
  }, [])
}

const getFlagsInput = (acc, flags, i) => {
  const flag = flags[i]

  return new Promise((resolve, reject) => {
    const opts = {}
    let message = `--${flag}`

    if (Array.isArray(flag)) {
      message = `--${flag[0]}`
      opts['value'] = `${flag[1]}`
    }

    textPrompt(message, opts)
      .on('submit', v => {
        acc.push(v)
        if (i === flags.length - 1) {
          resolve(acc)
        } else {
          resolve(getFlagsInput(acc, flags, i + 1))
        }
      })
      .on('abort', v => reject(v))
  })
}

const handleFunction = async (fn, name, offset = 0) => {
  if (isInteractive(argv)) {
    const args = introspect(fn)
    let values = []
    if (args.length > 0) {
      values = await getFlagsInput([], args, 0)
    }
    const result = await fn(...values)
    return result
  }

  if (isHelp(argv)) {
    const description = scrapeComments(fn)
    return (
      usageText(name) +
      flagsText(introspect(fn)) +
      (description ? '\n\nDESCRIPTION: ' + '\n' + description + '\n' : '')
    )
  }

  return parseFn(argv)(fn, offset)
}

const getSuggestion = subcommands => {
  const suggestsubCommands = input =>
    Promise.resolve(
      subcommands.filter(cmd => cmd.title.slice(0, input.length) === input),
    )

  return new Promise((resolve, reject) => {
    autocompletePrompt('Tab and enter to select a command', suggestsubCommands)
      .on('abort', reject)
      .on('submit', resolve)
  })
}

const handleObject = async input => {
  // find object in question (derived from argv)
  const [keys, method] = argv._.reduce(
    ([ks, m], arg, i) => {
      if (Object.getOwnPropertyNames(m).includes(arg)) {
        return [[...ks, arg], m[arg]]
      }
      return [ks, m]
    },
    [[], input],
  )

  if (isFunction(method)) {
    return handleFunction(method, keys[keys.length - 1], keys.length)
  }

  if (isObject(method)) {
    if (isInteractive(argv)) {
      const subcommands = getSubCommands(method)
      const cmd = await getSuggestion(subcommands)
      return fire(cmd)
    }

    if (isHelp(argv) || hasNoCmd(argv)) {
      const description = scrapeComments(method)
      const cmdHelpText = subcommandHelp(method, 0)
      return (
        usageText(keys.join(' ')) +
        (description ? '\n\nDESCRIPTION: ' + '\n\t' + description + '\n' : '') +
        '\n\nCOMMANDS:\n\n' +
        cmdHelpText
      )
    }

    return handleObject(method, Object.getOwnPropertyNames(method))
  }

  return parseFn(argv)(method, keys.length)
}

const fire = input => {
  if (isFunction(input)) {
    return handleFunction(input)
  }

  if (isObject(input)) {
    return handleObject(input)
  }

  throw TypeError('js-fire can only handle functions or objects')
}

const print = data => {
  console.log(String(data).trim())
}

module.exports = input =>
  fire(input)
    .then(print)
    .catch(print)
