const fire = require('../')

class Calculator {
  double(number) {
    const result = number * 2
    process.stdout.write(String(result))
    return result
  }

  half(number) {
    const result = number / 2
    process.stdout.write(String(result))
    return result
  }
}

fire(Calculator)
