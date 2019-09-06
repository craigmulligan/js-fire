const argv = require('minimist')(process.argv.slice(2))
const isObject = require('lodash.isplainobject')
const isFunction = require('lodash.isfunction')
const toSource = require('tosource')

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

const isHelp = argv => {
  if (argv['help']) {
    return true
  }
  return false
}

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

const print = data => {
  console.log(String(data).trim())
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

  const result = await fn(...values)
  print(result)
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

const handleFunction = (fn, name, offset = 0) => {
  if (isHelp(argv)) {
    const description = scrapeComments(fn)
    print(
      usageText(name) +
        flagsText(introspect(fn)) +
        (description ? '\n\nDESCRIPTION: ' + '\n' + description + '\n' : ''),
    )
    return
  }

  return parseFn(argv)(fn, offset)
}

const handleObject = input => {
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
    if (isHelp(argv)) {
      const description = scrapeComments(method)
      const cmdHelpText = subcommandHelp(method, 0)
      print(
        usageText(keys.join(' ')) +
          (description
            ? '\n\nDESCRIPTION: ' + '\n\t' + description + '\n'
            : '') +
          '\n\nCOMMANDS:\n\n' +
          cmdHelpText,
      )
      return
    }

    return handleObject(method, Object.getOwnPropertyNames(method))
  }

  return parseFn(argv)(method, keys.length)
}

const fire = function(input) {
  if (isFunction(input)) {
    return handleFunction(input)
  }

  if (isObject(input)) {
    return handleObject(input)
  }

  throw TypeError('js-fire can only handle functions or objects')
}

module.exports = fire
