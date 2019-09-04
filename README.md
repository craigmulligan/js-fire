# js-fire

> A javascript clone of [google/python-fire](https://github.com/google/python-fire)

js-fire is a library for automatically generating command line interfaces
(CLIs) from any js object.

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

You can call `Fire` on any js object:<br>
functions, classes, objects.

Here's an example of calling Fire on a class.

```javascript
const fire = require('js-fire')

class Calculator {
  double(number) {
    return 2 * number
  }

  add(n1 = Math.PI, n2) {
    return n1 + n2
  }
}
fire(Calculator)
```

Then, from the command line, you can run:

```bash
node calculator.js double --number=15  # 30
```

Automactic --help command.

```bash
node calculator.js --help

USAGE:
	node calculator.js <COMMAND>

	COMMANDS:

	double  --number=<number>
	add  --n1=3.141592653589793 --n2=<n2>
```

For additional examples, see [/examples](/examples).
