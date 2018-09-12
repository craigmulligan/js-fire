const minimist = require('minimist')
const argv = require('minimist')(process.argv.slice(2))
var getArgs = require('introspect-fun')
const inspect = require('util').inspect

function introspect(fn) {
  if (typeof fn === 'function') {
    const argumentsRegExp = /\((.+)\)|^[^=>]+(?=\b\s=>)/
    const noiseRegExp = /\s|\/\*[\s\S]*\*\/|^\(|\)$|=.*?(,|$)/g

    const res = argumentsRegExp.exec(fn.toString())
    return res
      ? res[0]
          .trim()
          .replace(noiseRegExp, '')
          .split(',')
      : []
  } else {
    throw new Error('NOT_A_FUNCTION')
  }
}

const parseFn = argv => fn => {
  const names = introspect(fn)
  const values = names.map(name => argv[name]).filter(Boolean)

  return fn(...values)
}

const isClass = fn => /class/.test(fn.toString())

const fire = function(input) {
  if (isClass(input)) {
    // construct class
    return fire(new input())
  }

  const inputType = typeof input
  switch (inputType) {
    case 'function':
      return parseFn(argv)(input)

    case 'object':
      const method = argv._[0]
      return parseFn(argv)(input[method])

      console.log(
        `js-fire can only handle functions or objects, you gave a {inputType}`,
      )
  }
}

module.exports = fire
