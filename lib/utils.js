const isObject = require('lodash.isplainobject')
const isFunction = require('lodash.isfunction')
const memoize = require('lodash.memoize')
const UNKNOWN_VALUE = 'js-fire-unknown-value'

/**
 * Recursively checks if any function exists within an object
 *
 * @param {Object} An Object
 * @return {Boolean} If a function was found
 *
 * @example
 *
 *     functionExists({ 'foo': 'bar' })
 */
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
const isLast = (argv, key) => {
  return key === last(argv._)
}
const flagIsPresent = flagName => argv => (argv[flagName] ? true : false)
const isInteractive = flagIsPresent('interactive')
const isHelp = flagIsPresent('help')

/**
 * Gets the keys of an object with some domain specific logic and sorts alphabetically
 * eg. removes "private" properties, values without functions
 *
 * @param {Function|Object} the function you want to parse
 * @return {String[]} If a function was found
 *
 * @example
 *     getProps({ _private: 'hii', myFn: () => {} }) // ['myFn']
 */
const getProps = instance => {
  const keys = Object.keys(instance)
    .filter(k => k != '__description__')
    .filter(k => !k.startsWith('_'))
    .filter(k => functionExists(instance[k]))
    .sort()

  return keys
}

/**
 * Get the arguments from a function
 * returns array of args if there is a default arg it returns it with array of arrays:
   eg [arg1, [arg2, <default>], arg3]
 *
 * @param {Function} the function you want to parse
 * @return {String[]} If a function was found
 * @throws {NotFunctionError}
 *
 * @example
 *
 *     introspect((param='foo') => { console.log('foo') }) // [['param', 'foo']]
 */
const introspect = memoize(fn => {
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
              let defaultValue = UNKNOWN_VALUE
              try {
                defaultValue = eval(param[1])
              } catch (e) {
                // in some cases its impossible eval the default value   
                // for instance if the reference is not in scope.
                // eg from node std lib: 
                // async function access(path, mode = F_OK)
              }
              return [param[0].trim(), defaultValue]
            }
            return s.trim()
          } catch (err) {
            throw err
          }
        })
      : []
  } else {
    throw new NotFunctionError()
  }
})

/**
 * Scrapes description from a function via __description__ || comments
 * Scrapes description from a object via __description__
 *
 * @param {object|function} instance
 * @return {string} The instance description
 *
 * @example
 *
 *     scrapeComments(() => {
 *        // this is an anon function
 *        console.log('hello world')
 *     }) // this is an anon function
 */
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

const alias = {
  h: 'help',
  i: 'interactive',
}

module.exports = {
  functionExists,
  last,
  getProps,
  introspect,
  isInteractive,
  isHelp,
  isLast,
  scrapeComments,
  alias,
  UNKNOWN_VALUE
}
