# js-fire [![CircleCI](https://circleci.com/gh/hobochild/js-fire.svg?style=svg)](https://circleci.com/gh/hobochild/js-fire)

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

## Basic Usage

You can call `Fire` on any functions and objects:<br>

Here's an example of calling Fire on a object, you can infinitely nest objects to create subcommands.

```javascript
const fire = require('js-fire')

const calculator = {
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
	node object.js

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
