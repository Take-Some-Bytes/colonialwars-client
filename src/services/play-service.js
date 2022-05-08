/* eslint-env browser */
/**
 * @fileoverview Service functions to set up a new player.
 */

import * as loaders from '../helpers/loaders'
import * as validator from '../helpers/validator'

const ServerPickerSchema = Object.freeze({
  name: validator.all(validator.string(), val => {
    if (!/^[\w[\]{}()$\-*.,~\s]*$/i.test(val)) {
      return new validator.ValidationError(
        'Invalid characters in player name!', 'EINVALID',
        'Please only enter alpanumeric characters, spaces' +
        ', and the following: []{}()$-*.,~'
      )
    } else if (!/^.{2,22}$/.test(val)) {
      return new validator.ValidationError(
        'Name is too long or too short!', 'ELENGTH',
        'Please enter a name between 2 and 22 characters.'
      )
    }
    return true
  }),
  server: validator.all(validator.string(), validator.httpURL())
})
const GamePickerSchema = Object.freeze({
  game: validator.all(validator.string(), validator.json()),
  team: validator.string()
})

/**
 * Validate data from the server picker.
 * @param {any} data The data to validate.
 * @returns {true | validator.ValidationError}
 */
export function validateServerPickerData (data) {
  return validator.validateObj(ServerPickerSchema, data)
}

/**
 * Validate data from the game picker.
 * @param {any} data The data to validate.
 * @param {Array<string>} availableTeams An array of available teams.
 * @returns {true | validator.ValidationError}
 */
export function validateGamePickerData (data, availableTeams) {
  const schema = Object.assign({
    // Make sure the selected team is an expected one.
    team: validator.all(GamePickerSchema.team, validator.isOneOf(availableTeams))
  }, GamePickerSchema)

  return validator.validateObj(schema, data)
}

/**
 * Gets game authorization for this client.
 * @param {string} serverUrl The location of the server.
 * @param {import('../apps/lobby-app').PlayOpts} opts Options.
 * @returns {Promise<string>}
 */
export async function getGameAuth (serverUrl, opts) {
  const query = new URLSearchParams({
    playername: opts.playerName,
    playerteam: opts.playerTeam,
    playergame: opts.gameID
  }).toString()
  const url = new URL(`/game-auth/get?${query}`, serverUrl)
  let res = null

  try {
    // Use fetch directly because we want granular control over error handling.
    res = await fetch(url, loaders.FETCH_CONFIG)
  } catch (ex) {
    // fetch() errored out.
    console.error(ex.stack)
    throw new Error('Something went wrong. Please try again later.')
  }

  if (res.status === 409) {
    // Player exists already.
    throw new Error('Player already exists.')
  } else if (!res.ok) {
    // I don't know what went wrong.
    throw new Error('Something went wrong. Please try again later.')
  }

  return (await res.json()).data.auth
}
