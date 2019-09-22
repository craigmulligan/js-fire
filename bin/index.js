#!/usr/bin/env node
const fire = require('../')
const minimist = require('minimist')

const createCLI = async modulePath => {
  let module
  try {
    module = require(modulePath)
  } catch (err) {
    console.log(err)
  }

  if (module) {
    const instance = module.default || module
    await fire(module)
  }
}

fire(
  createCLI,
  minimist(process.argv.slice(2), {
    '--': true,
    alias: {
      h: 'help',
      i: 'interactive',
    },
  }),
)
