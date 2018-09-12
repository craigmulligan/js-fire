# js-fire

> A javascript clone of [google/python-fire](https://github.com/google/python-fire)

\_js Fire is a library for automaticallyenerating command line interfaces
(CLIs) from absolutely any js object.

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
  double(n) {
    return 2 * n
  }
}
fire(Calculator)
```

Then, from the command line, you can run:

```bash
js calculator.py double --number=15  # 30
```

See [examples](examples) for object type examples.

For additional examples, see [/examples](/examples).
