const fire = require('../')

function defaults(number = 20) {
  const result = 2 * number
  process.stdout.write(String(result))
  return result
}

fire(defaults)
