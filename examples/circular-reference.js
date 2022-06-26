const fire = require("../");

const calculator = {
  half: (number) => +number / 2,
  double: (number) => +number * 2,
};

calculator["self"] = calculator;

fire(calculator);
