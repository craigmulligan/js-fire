const fire = require('../')

class Calculator {
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
