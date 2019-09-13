#!/usr/bin/env node
const fire = require('../')

const createCLI = async modulePath => {
  let module
  try {
    module = require(modulePath)
  } catch (err) {}

  if (module) {
    const instance = module.default || module
    await fire(module)
  }
}

fire(createCLI)
