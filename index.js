const argv = require('minimist')(process.argv.slice(2))

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

const print = data => {
  console.log(String(data).trim())
}

const parseFn = argv => async fn => {
  const args = introspect(fn)
  const values = args.map((name, i) => {
    // if it's a named param then we
    if (argv[name]) {
      return argv[name]
    }

    return argv['_'][i]
  })

  const result = await fn(...values)
  print(result)
}

const isClass = fn => /class/.test(fn.toString())

function getAllMethodNames(obj) {
  let methods = new Set()
  while ((obj = Reflect.getPrototypeOf(obj))) {
    let keys = Reflect.ownKeys(obj)
    keys.forEach(k => methods.add(k))
  }
  return methods
}

const handleClass = input => {
  const instance = new input()
  const proto = Object.getPrototypeOf(instance)

  const method = Object.getOwnPropertyNames(proto).find(k => {
    return argv._.includes(instance[k].name)
  })

  if (!method) {
    throw Error(`No method found`)
  }

  argv._ = argv._.filter(k => k != method)

  return parseFn(argv)(instance[method])
}

const handleObject = input => {
  const method = Object.getOwnPropertyNames(input).find(k => {
    return argv._.includes(input[k].name)
  })

  if (!method) {
    throw Error(`No method found`)
  }

  argv._ = argv._.filter(k => k != method)

  return parseFn(argv)(input[method])
}

const fire = function(input) {
  let inputType = typeof input

  if (isClass(input)) {
    // construct class
    inputType = 'class'
  }

  switch (inputType) {
    case 'class':
      return handleClass(input)

    case 'function':
      return parseFn(argv)(input)
    case 'object':
      return handleObject(input)

      console.log(
        `js-fire can only handle functions or objects, you gave a {inputType}`,
      )
  }
}

module.exports = fire
