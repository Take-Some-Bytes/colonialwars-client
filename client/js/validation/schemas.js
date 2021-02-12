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
    playerName: validator.all(validator.string(), val => {
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
    server: validator.all(validator.string(), validator.json())
  }
]
