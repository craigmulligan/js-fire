const fire = require('../')

function defaults(number = 20) {
  const result = 2 * number
  return result
}

fire(defaults)
