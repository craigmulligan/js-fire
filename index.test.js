const fire = require('./')
const { exec } = require('child_process')

describe('js-fire', () => {
  test('functions input', done => {
    res = exec(
      'node examples/double.js --number 2',
      {
        cwd: __dirname,
      },
      (error, stdout, stderr) => {
        expect(stdout).toEqual('4')
        done()
      },
    )
  })

  test('functions input with no a', done => {
    res = exec(
      'node examples/double.js',
      {
        cwd: __dirname,
      },
      (error, stdout, stderr) => {
        expect(stdout).toEqual('NaN')
        done()
      },
    )
  })

  test('functions works with default as', done => {
    res = exec(
      'node examples/defaults.js',
      {
        cwd: __dirname,
      },
      (error, stdout, stderr) => {
        expect(stdout).toEqual('40')
        done()
      },
    )
  })

  test('object works with default as', done => {
    res = exec(
      'node examples/object.js half --number 20',
      {
        cwd: __dirname,
      },
      (error, stdout, stderr) => {
        expect(stdout).toEqual('10')
        done()
      },
    )
  })

  test('class', done => {
    res = exec(
      'node examples/class.js half --number 20',
      {
        cwd: __dirname,
      },
      (error, stdout, stderr) => {
        expect(stdout).toEqual('10')
        done()
      },
    )
  })

  test('async functions', done => {
    res = exec(
      'node examples/async.js --number 20',
      {
        cwd: __dirname,
      },
      (error, stdout, stderr) => {
        expect(stdout).toEqual('40')
        done()
      },
    )
  })
})
