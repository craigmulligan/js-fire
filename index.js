const argv = require('minimist')(process.argv.slice(2))

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
    throw new Error('NOT_A_FUNCTION')
  }
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
  return '\n'
}

const print = data => {
  console.log(String(data).trim())
}

const parseFn = argv => async fn => {
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

    return argv['_'][i]
  })

  const result = await fn(...values)
  print(result)
}

const handleClass = input => {
  const instance = new input()
  const proto = Object.getPrototypeOf(instance)
  const availableMethods = Object.getOwnPropertyNames(proto).filter(
    m => m !== 'constructor',
  )

  return handleObject(instance, availableMethods)
}

const handleObject = (input, methods) => {
  const method = methods.find(k => {
    return argv._.includes(input[k].name)
  })

  if (!method) {
    const cmdHelpText = methods.reduce((acc, key) => {
      const args = introspect(input[key])
      acc = acc + '\t' + key + ' ' + flagsText(args) + '\n'
      return acc
    }, ``)

    print(usageText('<COMMAND>') + '\n\n\tCOMMANDS:\n\n' + cmdHelpText)
    return
  }

  argv._ = argv._.filter(k => k != method)

  if (isHelp(argv)) {
    print(usageText(method) + flagsText(introspect(input[method])))
    return
  }

  return parseFn(argv)(input[method])
}

const isClass = fn => /class/.test(fn.toString())
const getType = input => {
  if (isClass(input)) {
    return 'class'
  }

  return typeof input
}

const fire = function(input) {
  switch (getType(input)) {
    case 'function':
      if (isHelp(argv)) {
        print(usageText() + flagsText(introspect(input)))
        return
      }
      return parseFn(argv)(input)
    case 'object':
      const availableMethods = Object.getOwnPropertyNames(input)
      return handleObject(input, availableMethods)
    case 'class':
      return handleClass(input)

    default:
      console.log(
        `js-fire can only handle functions or objects, you gave a ${getType(
          input,
        )}`,
      )
  }
}

module.exports = fire
