const fire = require('./')
const { exec } = require('child_process')

describe('js-fire', () => {
  test('functions input with no arg', done => {
    res = exec(
      'node examples/double.js',
      {
        cwd: __dirname,
      },
      (error, stdout, stderr) => {
        expect(stdout.trim()).toEqual('')
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
        expect(stdout.trim()).toEqual('40')
        done()
      },
    )
  })

  describe('object', () => {
    test('half', done => {
      res = exec(
        'node examples/object.js half --number 20',
        {
          cwd: __dirname,
        },
        (error, stdout, stderr) => {
          expect(stdout.trim()).toEqual('10')
          done()
        },
      )
    })

    test('double', done => {
      res = exec(
        'node examples/object.js double --number 20',
        {
          cwd: __dirname,
        },
        (error, stdout, stderr) => {
          expect(stdout.trim()).toEqual('40')
          done()
        },
      )
    })

    test('works without named args', done => {
      res = exec(
        'node examples/object.js double 20',
        {
          cwd: __dirname,
        },
        (error, stdout, stderr) => {
          expect(stdout.trim()).toEqual('40')
          done()
        },
      )
    })
  })

  describe('class', () => {
    test('half', done => {
      res = exec(
        'node examples/class.js half --number 20',
        {
          cwd: __dirname,
        },
        (error, stdout, stderr) => {
          expect(stdout.trim()).toEqual('10')
          done()
        },
      )
    })

    test('triple', done => {
      res = exec(
        'node examples/class.js triple',
        {
          cwd: __dirname,
        },
        (error, stdout, stderr) => {
          expect(stdout.trim()).toEqual('40')
          done()
        },
      )
    })
  })

  test('async functions', done => {
    res = exec(
      'node examples/async.js --number 20',
      {
        cwd: __dirname,
      },
      (error, stdout, stderr) => {
        expect(stdout.trim()).toEqual('40')
        done()
      },
    )
  })

  describe('multi-args', () => {
    test('multi unname args', done => {
      res = exec(
        'node examples/multi-args.js 30 20',
        {
          cwd: __dirname,
        },
        (error, stdout, stderr) => {
          expect(stdout.trim()).toEqual('10')
          done()
        },
      )
    })
  })

  test('multi named args', done => {
    res = exec(
      'node examples/multi-args.js --b 30 --a 20',
      {
        cwd: __dirname,
      },
      (error, stdout, stderr) => {
        expect(stdout.trim()).toEqual('-10')
        done()
      },
    )
  })
})
