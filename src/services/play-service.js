/* eslint-env browser */
/**
 * @fileoverview Service functions to set up a new player.
 */

import Joi from 'joi'

import * as loaders from '../helpers/loaders'

/**
 * Joi but with JSON string-to-object coercion.
 * @type {import('joi')}
 */
const JoiWithCoercion = Joi.extend(joi => (({
  type: 'object',
  base: joi.object(),
  coerce: {
    from: 'string',
    method (val, _) {
      try {
        return { value: JSON.parse(val) }
      } catch (ex) {
        return { value: val }
      }
    }
  }
})))

// Expected to be JSON.
const GameInfoSchema = JoiWithCoercion.object({
  id: JoiWithCoercion.alternatives(JoiWithCoercion.string(), JoiWithCoercion.number()),
  name: JoiWithCoercion.string(),
  mode: JoiWithCoercion.string().insensitive().valid('teams', 'koth', 'siege'),
  teams: JoiWithCoercion.array().items(JoiWithCoercion.string()),
  description: JoiWithCoercion.string(),
  capacity: JoiWithCoercion.object({
    max: JoiWithCoercion.number(),
    current: JoiWithCoercion.number()
  })
}).prefs({ presence: 'required' })
const ServerPickerSchema = JoiWithCoercion.object({
  name: JoiWithCoercion.string()
    .pattern(/^[\w[\]{}()$\-*.,~\s]*$/i, 'valid name')
    .min(2)
    .max(22)
    .messages({
      'string.empty': 'Player name is required.',
      'string.min': 'Player name is too short.',
      'string.max': 'Player name is too long.',
      'string.pattern.name': 'Player name contains invalid characters.'
    }),
  server: JoiWithCoercion.string().uri({
    scheme: ['http', 'https']
  })
}).prefs({ presence: 'required', convert: false })
const GamePickerSchema = JoiWithCoercion.object({
  game: GameInfoSchema.prefs({ convert: true }),
  team: JoiWithCoercion.string()
}).prefs({ presence: 'required', convert: false })

/**
 * Validate data from the server picker.
 * @param {any} data The data to validate.
 * @returns {import('joi').ValidationResult<any>}
 */
export function validateServerPickerData (data) {
  return ServerPickerSchema.validate(data)
}

/**
 * Validate data from the game picker.
 * @param {any} data The data to validate.
 * @param {Array<string>} availableTeams An array of available teams.
 * @returns {import('joi').ValidationResult<any>}
 */
export function validateGamePickerData (data, availableTeams) {
  return GamePickerSchema.keys({
    team: JoiWithCoercion.string().valid(...availableTeams)
  }).validate(data)
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
