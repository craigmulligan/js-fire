const fire = require("../");

const calculator = {
  __description__: "I am a math machine",
  half: (number) => +number / 2,
  double: (number) => +number * 2,
  add: (n1 = Math.PI, n2) => {
    return +n1 + +n2;
  },
  misc: {
    year: () => {
      // the year I was made
      return "1999";
    },
    brand: () => "casio",
    hello: (name) => {
      // prints your name
      return `hi ${name}`;
    },
    info: {
      greeting: (name = "hobochild") => `greetings ${name}!`,
    },
  },
};

fire(calculator);
