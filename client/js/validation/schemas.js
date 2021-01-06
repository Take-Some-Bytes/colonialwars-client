/* eslint-env browser */
/**
 * @fileoverview List of required input validation schemas.
 */

import * as validator from './validator.js'

/**
 * @type {Array<validator.ValidatorSchema>}
 */
export const playInputSchemas = [
  {
    playerName: val => {
      if (typeof val !== 'string') {
        return new validator.ValidationError(
          'Player name does not exist or is not a string!', 'EINVAlID',
          'Please enter a name between 2 and 22 characters.'
        )
      } else if (!/^\w{2,23}$/.test(val)) {
        return new validator.ValidationError(
          'Player name is too long or too short!', 'ELENGTH',
          'Please enter a name between 2 and 22 characters.'
        )
      }
      return true
    },
    server: val => {
      const results = []
      const errors = []
      results.push(validator.string()(val))
      results.push(validator.json()(val))
      errors.push(...results.filter(result => result instanceof validator.ValidationError))

      if (errors.length > 0) {
        return errors[0]
      }
      return true
    }
  }
]
