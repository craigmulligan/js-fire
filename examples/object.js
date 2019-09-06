const fire = require('../')

const calculator = {
  half: number => number / 2,
  double: number => number * 2,
  add: (n1 = Math.PI, n2) => n1 + n2,
  misc: {
    year: () => {
      // the year I was made
      return '1999'
    },
    brand: () => 'casio',
    hello: name => `hi ${name}`,
  },
}

fire(calculator)
