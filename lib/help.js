const minimist = require('minimist')
const fs = require('fs')
const { getProps, introspect, scrapeComments } = require('./utils')
const isObject = require('lodash.isplainobject')
const isFunction = require('lodash.isfunction')

/**
 * Returns the Usage help text for calling the cli using process.argv
 *
 * @return {string} formatted usage text
 *
 * @example
 *     usageText() // USAGE:\n mycli
 *
 */
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

/**
 * Returns the Flags help text for calling the function in question
 *
 * @param {string[]} The functions args
 * @return {string} formatted flagsText text
 *
 * @example
 *     usageText([['foo': 'bar'], 'name']) // --foo=bar --name=<name>
 *
 */
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

/**
 * Formats the helpText for an object
 * Used for subcommandHelp
 * @param {object} the instance
 * @param {number} the tab depth of the command
 */
const subcommandsText = (input, depth = 1) => {
  return getProps(input).reduce((acc, key) => {
    if (isObject(input[key])) {
      acc =
        acc +
        '\n\t' +
        '\t'.repeat(depth) +
        key +
        '\n' +
        subcommandsText(input[key], depth + 1)

      return acc
    }

    if (isFunction(input[key])) {
      const args = introspect(input[key])
      acc =
        acc +
        '\t'.repeat(depth) +
        '\t' +
        key +
        ' <flags>' +
        flagsText(args) +
        '\n'

      return acc
    }

    return acc
  }, '')
}

/**
 * Formats function helpText
 * @param {function} instance
 * @return {string} helpText
 */
const functionText = fn => {
  const description = scrapeComments(fn)
  return (
    usageText() +
    flagsText(introspect(fn)) +
    (description ? '\n\nDESCRIPTION: ' + '\n' + description + '\n' : '')
  )
}

module.exports = {
  usageText,
  subcommandsText,
  functionText,
}
