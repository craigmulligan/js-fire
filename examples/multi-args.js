const fire = require('../')

// prettier-ignore
function minus(a=Math.PI, b=20, noop=false, randomString='hiii') {
  return a - b
}

fire(minus)
