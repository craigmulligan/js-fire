const minimist = require('minimist')
const isObject = require('lodash.isplainobject')
const isFunction = require('lodash.isfunction')
const chalk = require('chalk')
const fs = require('fs')
const stringSimilarity = require('string-similarity')
const fclone = require('fclone')
const {
  functionExists,
  last,
  getProps,
  introspect,
  isInteractive,
  isHelp,
  isLast,
  scrapeComments,
  alias,
} = require('./utils')
const {
  NotFunctionError,
  CommandNotFoundError,
  FlagNotFoundError,
  InvariantViolationError,
} = require('./errors')
const interactive = require('./interactive')
const help = require('./help')

/**
 * Matches up Argv with functions args
 * and calls the function
 *
 */
const parseFn = argv => async (fn, offset = 0) => {
  const args = validateArgs(argv, fn)

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

  return fn(...values)
}

/**
 * Gets subcommands from an instance
 * @param {object}
 * @return {{key: string, description: string: instance: *}[]}
 */
const getSubCommands = input => {
  return getProps(input).reduce((acc, key) => {
    acc.push({
      key,
      description: scrapeComments(input[key]) || '',
      instance: input[key],
    })
    return acc
  }, [])
}

/**
 * Checks for subcommands calls that are not in the object properties
 * @param {object} argv
 * @param {string[]} the valid subcommand names
 * @returns {string}
 */
const cmdNotFound = (argv, props) => {
  if (argv._.length === 0) {
    return chalk.red(`Error: Command not found\n\n`)
  }

  const match = stringSimilarity.findBestMatch(last(argv._), props).bestMatch

  return (
    chalk.red(
      `Error: Command ${chalk.red.underline(last(argv._))} not found\n`,
    ) +
    (match.rating > 0.4
      ? chalk.yellow(`Did you mean: ${chalk.yellow.underline(match.target)} ?`)
      : '') +
    '\n\n'
  )
}

/**
 * Checks if the stdin opts are valid flags
 *
 * @param {object} argv from minimist
 * @param {function} the function being called
 * @throws {FlagNotFoundError} If the there is an unknown flag
 * @return {string[]} The function args
 *
 * @example
 *     checkArgs({ foo }, (param='foo') => { console.log('foo') }) // [['param', 'foo']]
 *
 */
const validateArgs = (argv, fn) => {
  const args = introspect(fn)

  const argNames = args.map(a => {
    if (Array.isArray(a)) {
      return a[0]
    }
    return a
  })

  Object.keys(argv)
    .filter(arg => !['help', 'interactive', '_', '--', 'h', 'i'].includes(arg))
    .map(flag => {
      if (!argNames.includes(flag)) {
        const match = stringSimilarity.findBestMatch(flag, argNames).bestMatch

        throw new FlagNotFoundError(
          chalk.red(`Error: Flag ${chalk.red.underline(flag)} not found\n`) +
            (match.rating > 0.4
              ? chalk.yellow(
                  `Did you mean: ${chalk.yellow.underline(match.target)} ?`,
                )
              : '') +
            '\n' +
            help.functionText(fn),
        )
      }
    })

  return args
}

const handleFunction = argv => async (fn, name, offset = 0) => {
  if (isInteractive(argv) && isLast(argv, name)) {
    const args = introspect(fn)
    const values = await interactive.getFlags(args)
    const result = await fn(...values)
    return result
  }

  if (isHelp(argv) && isLast(argv, name)) {
    return help.functionText(fn)
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
    const cmd = await interactive.getSubCommand(subcommands)
    // adjust the argv with interactive
    argv._.push(cmd.key)

    if (isFunction(cmd.instance)) {
      return handleFunction(argv)(cmd.instance, cmd.instance.name, keys.length)
    }

    return fire(argv)(cmd.instance)
  }

  const description = scrapeComments(method)
  const cmdHelpText = help.subcommandsText(method, 0)

  if (isHelp(argv)) {
    return (
      cmdNotFound(argv, getProps(method)) +
      help.usageText() +
      (description ? '\n\nDESCRIPTION: ' + '\n\t' + description + '\n' : '') +
      '\n\nCOMMANDS:\n\n' +
      cmdHelpText
    )
  }

  // this means that the caller tried to call an object
  throw new CommandNotFoundError(
    cmdNotFound(argv, getProps(method)) +
      help.usageText() +
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

  throw new InvariantViolationError()
}

module.exports = (
  input,
  argv = minimist(process.argv.slice(2), {
    alias,
  }),
) => {
  fire(argv)(input)
    .then(data => {
      if (data == null) {
        // Hide the response from stdout if it's undefined || null
        return
      }
      console.log(String(data).trim())
    })
    .catch(err => {
      if (err instanceof CommandNotFoundError) {
        console.log(err.message)
        process.exit(1)
        return
      }

      if (err instanceof FlagNotFoundError) {
        console.log(err.message)
        process.exit(1)
        return
      }

      console.log(err)
      process.exit(1)
    })
}
