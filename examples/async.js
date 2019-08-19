const fire = require('../')

function double(number) {
  return new Promise((res, rej) => {
    setTimeout(() => {
      const result = 2 * number
      res(result)
    }, 500)
  })
}

fire(double)
