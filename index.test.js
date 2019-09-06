const fire = require('./')
const { exec } = require('child_process')

const cmd = argv => {
  return new Promise((res, rej) => {
    exec(
      argv,
      {
        cwd: __dirname,
      },
      (err, stdout, stderr) => {
        if (err) {
          rej(err)
        }
        res(stdout)
      },
    )
  })
}

describe('js-fire', () => {
  describe('function', () => {
    test('functions works with default as', async () => {
      const stdout = await cmd('node examples/function.js')
      expect(stdout.trim()).toEqual('40')
    })
    test('helpText', async () => {
      const stdout = await cmd('node examples/function.js --help')
      expect(stdout).toMatchSnapshot()
    })
  })

  describe('arrow function', () => {
    test('functions works unnamed arg', async () => {
      const stdout = await cmd('node examples/arrow-function.js 20')
      expect(stdout.trim()).toEqual('40')
    })
    test('helpText', async () => {
      const stdout = await cmd('node examples/arrow-function.js --help')
      expect(stdout).toMatchSnapshot()
    })
  })

  describe('object', () => {
    test('half', async () => {
      const stdout = await cmd('node examples/object.js half --number 20')
      expect(stdout.trim()).toEqual('10')
    })

    test('double', async () => {
      const stdout = await cmd('node examples/object.js double --number 20')
      expect(stdout.trim()).toEqual('40')
    })

    test('works without named args', async () => {
      const stdout = await cmd('node examples/object.js double 20')
      expect(stdout.trim()).toEqual('40')
    })

    test('works with deeply nested objects', async () => {
      const stdout = await cmd(
        'node examples/object.js misc hello --name hobochild',
      )
      expect(stdout.trim()).toEqual('hi hobochild')
    })

    test('helpText', async () => {
      const stdout = await cmd('node examples/object.js --help')
      expect(stdout).toMatchSnapshot()
    })

    test('helpText with subcommand', async () => {
      const stdout = await cmd('node examples/object.js double --help')
      expect(stdout).toMatchSnapshot()
    })
  })

  test('async functions', async () => {
    const stdout = await cmd('node examples/async.js --number 20')
    expect(stdout.trim()).toEqual('40')
  })

  describe('multi-args', () => {
    test('multi unname args', async () => {
      const stdout = await cmd('node examples/multi-args.js 30 20')
      expect(stdout.trim()).toEqual('10')
    })
  })

  test('multi named args', async () => {
    const stdout = await cmd('node examples/multi-args.js --b 30 --a 20')
    expect(stdout.trim()).toEqual('-10')
  })

  test('works with default (eval) values', async () => {
    const stdout = await cmd('node examples/multi-args.js --b 1')
    const answer = Math.PI - 1
    expect(stdout.trim()).toEqual(answer.toString())
  })

  test('helpText', async () => {
    const stdout = await cmd('node examples/multi-args.js --help')
    expect(stdout.trim()).toMatchSnapshot()
  })
})
