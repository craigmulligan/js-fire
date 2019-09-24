const { AutoComplete, prompt } = require('enquirer')

/**
 * Gets subcommand selection from user in interactive mode
 * @param {object[]} { key, description, instance }
 * @return {object} The selected subcommand
 */
const getSubCommand = async subcommands => {
  const prompt = new AutoComplete({
    name: 'Subcommand',
    message: 'Select a command',
    limit: 100,
    choices: subcommands.map(cmd => cmd.key),
  })

  const answer = await prompt.run()

  return subcommands.find(cmd => cmd.key == answer)
}

/**
 * Get flags values in interactive mode
 * @param {string[]} array of flags keys
 * @return {string[]} array of flags values
 */

const getFlags = async flags => {
  if (flags.length == 0) {
    return []
  }

  const flagsInput = flags.map(flag => {
    if (Array.isArray(flag)) {
      return {
        name: `--${flag[0]}`,
        type: 'input',
        initial: `${flag[1]}`,
      }
    }

    return {
      name: `--${flag}`,
      type: 'input',
    }
  })

  const res = await prompt(flagsInput)
  return flags.map(f => {
    if (Array.isArray(f)) {
      return res[`--${f[0]}`]
    }
    return res[`--${f}`]
  })
}

module.exports = {
  getSubCommand,
  getFlags,
}
