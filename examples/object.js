const fire = require('../')

const double = number => {
  const result = 2 * number
  process.stdout.write(String(result))
  return result
}

const half = number => {
  const result = number / 2
  process.stdout.write(String(result))
  return result
}

const math = {
  half,
  double,
}

fire(math)
