# js-fire [![Node.js CI](https://github.com/hobochild/js-fire/actions/workflows/node.js.yml/badge.svg)](https://github.com/hobochild/js-fire/actions/workflows/node.js.yml)

> A javascript implementation of [google/python-fire](https://github.com/google/python-fire)

js-fire is a library for automatically generating command line interfaces
(CLIs) from most js objects.

* js Fire is a simple way to create a CLI in js.
* js Fire helps with exploring existing code or turning other people's code
  into a CLI.
* js Fire makes transitioning between Bash and js easier.

## Installation

```
yarn add js-fire
```

```
npm install js-fire
```

js-fire is exposed as both an [API](#api-usage) and a [CLI](#cli-usage).

## API Usage

You can call `Fire` on any functions and objects:<br>

Here's an example of calling Fire on a object, you can infinitely nest objects to create subcommands.

```javascript
const fire = require('js-fire')

const calculator = {
  __description__: 'I am a math machine',
  double: number => {
    // I double things
    return 2 * number
  },
  add: (n1 = Math.PI, n2) => {
    return n1 + n2
  },
  misc: {
    year: () => '1999',
    brand: () => 'casio',
    hello: name => `hello ${name}`,
  },
}

fire(calculator)
```

Then, from the command line, you can run:

```bash
node calculator.js double --number=15  # 30
```

```bash
node calculator.js misc hello hobochild  # 'hello hobochild'
```

Automactic `--help` command.

```bash
node calculator.js --help

USAGE:
	node calculator.js

DESCRIPTION:
	I am a math machine

COMMANDS:

	half  --number=<number>
	double  --number=<number>
	add  --n1=3.141592653589793  --n2=<n2>

	misc
		year
		brand
		hello  --name=<name>
```

Automatic `--interactive` mode:

[![asciicast](https://asciinema.org/a/QdxxOZgsK4Wp0nxT7ZEn6mXIi.svg)](https://asciinema.org/a/QdxxOZgsK4Wp0nxT7ZEn6mXIi)

For additional examples, see [/examples](/examples).

## CLI Usage

js-fire exposes a CLI that takes modulePath and passes it to `js-fire`.

```bash
USAGE:
	js-fire  --modulePath=<modulePath>
```

### Example

So you can js-fire on _most_ js modules.

```bash
js-fire fs -- writeFileSync --path=hello.txt --data="hiii"
```

You can also use `interactive` and `help` mode to explore a modules api:

```bash
js-fire fs -- -h

USAGE:
	js-fire

COMMANDS:

	appendFile <flags> --path=<path>  --data=<data>  --options=<options>  --callback=<callback>
	appendFileSync <flags> --path=<path>  --data=<data>  --options=<options>
	access <flags> --path=<path>  --mode=<mode>  --callback=<callback>
	accessSync <flags> --path=<path>  --mode=<mode>
	chown <flags> --path=<path>  --uid=<uid>  --gid=<gid>  --callback=<callback>
	chownSync <flags> --path=<path>  --uid=<uid>  --gid=<gid>
	chmod <flags> --path=<path>  --mode=<mode>  --callback=<callback>
	chmodSync <flags> --path=<path>  --mode=<mode>
	close <flags> --fd=<fd>  --callback=<callback>
	closeSync <flags> --fd=<fd>
	copyFile <flags> --src=<src>  --dest=<dest>  --flags=<flags>  --callback=<callback>
	copyFileSync <flags> --src=<src>  --dest=<dest>  --flags=<flags>
	createReadStream <flags> --path=<path>  --options=<options>
	createWriteStream <flags> --path=<path>  --options=<options>
	exists <flags> --path=<path>  --callback=<callback>
	existsSync <flags> --path=<path>
  ...
```
