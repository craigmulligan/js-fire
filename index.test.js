const fire = require('./')
const util = require('util')
const fs = require('fs')
const execCb = require('child_process').exec
const exec = util.promisify(execCb)

describe('js-fire', () => {
  describe('function', () => {
    test('functions works with default as', async () => {
      const { stdout } = await exec('node examples/function.js')
      expect(stdout.trim()).toEqual('40')
    })
    test('helpText', async () => {
      const { stdout } = await exec('node examples/function.js --help')
      expect(stdout).toMatchSnapshot()
    })
  })

  describe('arrow function', () => {
    test('functions works unnamed arg', async () => {
      const { stdout } = await exec('node examples/arrow-function.js 20')
      expect(stdout.trim()).toEqual('40')
    })
    test('helpText', async () => {
      const { stdout } = await exec('node examples/arrow-function.js --help')
      expect(stdout).toMatchSnapshot()
    })
  })

  describe('circular reference', async () => {
    test('should compile', async () => {
      const { stdout } = await exec(
        'node examples/circular-reference.js half --number 20',
      )
      expect(stdout.trim()).toEqual('10')
    })
  })

  describe('lib', () => {
    // tests whether you can call a arbitratry library via the js-fire api.

    test('write a file with fs', async () => {
      const path = __dirname + '/test.txt'
      await exec(
        `node bin/index.js fs writeFileSync --path ${path} --data "hiii"`,
      )
      const constents = fs.readFileSync(path)
      expect(constents.toString()).toEqual('hiii')
      // cleanup
      fs.unlinkSync(path)
    })

    test('helpText', async () => {
      const { stdout } = await exec('node bin/index.js fs -h')
      expect(stdout.trim()).toMatchSnapshot()
    })
  })

  describe('cli', () => {
    const opts = { cwd: 'examples/cli' }

    beforeAll(async () => {
      await exec(`yarn link`, opts)
    })

    test('helpText', async () => {
      const { stdout } = await exec('js-fire-example -h')
      // Command usage should ref js-fire
      expect(stdout.trim()).toMatchSnapshot()
    })
  })

  describe('interactive', () => {
    const keys = {
      up: '\x1B\x5B\x41',
      down: '\x1B\x5B\x42',
      enter: '\x0D',
      space: '\x20',
    }

    test('object with subcommand', done => {
      const ps = execCb('node examples/object.js half -i', (err, stdout) => {
        expect(stdout.trim()).toContain('10')
        done()
      })

      ps.stdin.write(`20${keys.enter}`)
    })

    test('object from root', done => {
      const ps = execCb('node examples/object.js misc -i', (err, stdout) => {
        console.log(stdout)
        expect(stdout.trim()).toContain('greetings hobo!')
        done()
      })

      setTimeout(() => ps.stdin.write(`info\r\n`), 100)
      setTimeout(() => ps.stdin.write(`greeting\r\n`), 200)
      setTimeout(() => ps.stdin.write(`hobo\r\n`), 400)
    })

    test('object from root', done => {
      const ps = execCb('node examples/object.js -i', (err, stdout) => {
        console.log(stdout)
        expect(stdout.trim()).toContain('greetings hobo!')
        done()
      })

      setTimeout(() => ps.stdin.write(`misc\r\n`), 100)
      setTimeout(() => ps.stdin.write(`info\r\n`), 200)
      setTimeout(() => ps.stdin.write(`greeting\r\n`), 400)
      setTimeout(() => ps.stdin.write(`hobo\r\n`), 600)
    })
  })

  describe('bin', () => {
    beforeAll(async () => {
      await exec(`yarn link`)
    })

    test('helpText', async () => {
      const { stdout } = await exec('js-fire -h')
      // Command usage should ref js-fire
      expect(stdout.trim()).toMatchSnapshot()
    })

    test('helpText with subcommand without help flag', async () => {
      const { stdout } = await exec('js-fire fs -h')
      // Command usage should ref js-fire
      expect(stdout.trim()).toMatchSnapshot()
    })

    test('helpText with subcommand with help flag', async () => {
      const { stdout } = await exec('js-fire fs -h')
      expect(stdout.trim()).toMatchSnapshot()
    })

    test('helpText with incorrect subcommand name', async () => {
      // this should return a suggested command in the output
      try {
        const { stdout } = await exec('js-fire fs appendF')
        // this should return an exit code 1
      } catch (err) {
        expect(err.stdout.trim()).toMatchSnapshot()
      }
    })

    test('bin with named args', async () => {
      const { stdout } = await exec(
        `js-fire fs existsSync --path ${__filename}`,
      )
      expect(stdout.trim()).toEqual('true')
    })

    test('bin with positional args', async () => {
      const { stdout } = await exec(`js-fire fs existsSync ${__filename}`)
      expect(stdout.trim()).toEqual('true')
    })
  })

  describe('object', () => {
    test('half', async () => {
      const { stdout } = await exec('node examples/object.js half --number 20')
      expect(stdout.trim()).toEqual('10')
    })

    test('double', async () => {
      const { stdout } = await exec(
        'node examples/object.js double --number 20',
      )
      expect(stdout.trim()).toEqual('40')
    })

    test('works without named args', async () => {
      const { stdout } = await exec('node examples/object.js double 20')
      expect(stdout.trim()).toEqual('40')
    })

    test('works with deeply nested objects', async () => {
      const { stdout } = await exec(
        'node examples/object.js misc hello --name hobochild',
      )
      expect(stdout.trim()).toEqual('hi hobochild')
    })

    test('helpText', async () => {
      const { stdout } = await exec('node examples/object.js --help')
      expect(stdout).toMatchSnapshot()
    })

    test('helpText with subcommand', async () => {
      const { stdout } = await exec('node examples/object.js double --help')
      expect(stdout).toMatchSnapshot()
    })

    test('command not found', async () => {
      // test case for:
      // https://github.com/hobochild/js-fire/issues/22
      const { stdout } = await exec(
        'node examples/object.js misc; echo "exit code $?"',
      )
      expect(stdout).toMatchSnapshot()
    })

    test('deeply nested', async () => {
      const { stdout } = await exec(
        'node examples/object.js misc info greeting --name hobochild',
      )
      expect(stdout.trim()).toEqual('greetings hobochild!')
    })

    test('deeply nested with typo', async () => {
      const { stdout } = await exec(
        'node examples/object.js misc info greeting --name hobochild',
      )
      expect(stdout).toMatchSnapshot()
    })
  })

  test('async functions', async () => {
    const { stdout } = await exec('node examples/async.js --number 20')
    expect(stdout.trim()).toEqual('40')
  })

  describe('multi-args', () => {
    test('multi unname args', async () => {
      const { stdout } = await exec('node examples/multi-args.js 30 20')
      expect(stdout.trim()).toEqual('10')
    })
  })

  test('multi named args', async () => {
    const { stdout } = await exec('node examples/multi-args.js --b 30 --a 20')
    expect(stdout.trim()).toEqual('-10')
  })

  test('works with default (eval) values', async () => {
    const { stdout } = await exec('node examples/multi-args.js --b 1')
    const answer = Math.PI - 1
    expect(stdout.trim()).toEqual(answer.toString())
  })

  test('helpText', async () => {
    const { stdout } = await exec('node examples/multi-args.js --help')
    expect(stdout.trim()).toMatchSnapshot()
  })
})
