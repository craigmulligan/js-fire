class CommandNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "CommandNotFound";
  }
}

class FlagNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "FlagNotFound";
  }
}

class NotFunctionError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFunctionError";
  }
}

class InvariantViolationError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvariantViolationError";
  }
}

module.exports = {
  NotFunctionError,
  CommandNotFoundError,
  FlagNotFoundError,
  InvariantViolationError,
};
