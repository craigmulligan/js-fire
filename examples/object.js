const fire = require('../')

const double = number => {
  const result = 2 * number
  return result
}

const half = number => {
  const result = number / 2
  return result
}

const math = {
  half,
  double,
}

fire(math)
