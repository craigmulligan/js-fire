const fire = require('../')

class Calculator {
  constructor() {
    this.prop = 'prop'
    this.something = 256
  }

  double(number) {
    const result = number * 2
    return result
  }

  half(number) {
    const result = number / 2
    return result
  }

  triple(number = 20) {
    const result = number * 2
    return result
  }
}

fire(Calculator)
