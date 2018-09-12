const fire = require('../')
function double(number) {
  const result = 2 * number
  process.stdout.write(String(result))
  return result
}

fire(double)
