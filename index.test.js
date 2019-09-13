const fire = require('./')
const util = require('util')
const fs = require('fs')
const exec = util.promisify(require('child_process').exec)
const pty = require('node-pty')

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
    test('object with subcommand', done => {
      const ps = pty.spawn('node', ['examples/object.js', 'half', '-i'], {
        env: process.env,
      })

      let count = 0
      ps.on('data', data => {
        if (count == 7) {
          expect(data.toString().trim()).toEqual('10')
          done()
        }

        count++
      })

      ps.write('20\r')
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

    test('helpText with subcommand', async () => {
      const { stdout } = await exec('js-fire fs -h')
      // Command usage should ref js-fire
      expect(stdout.trim()).toMatchSnapshot()
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
