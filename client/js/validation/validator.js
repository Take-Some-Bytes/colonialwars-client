/* eslint-env browser */
/**
 * @fileoverview Functions to validate values.
 */

/**
 * ValidationError class.
 */
export class ValidationError extends Error {
  /**
   * Constructor for a ValidationError class.
   * @class
   * @param {string} msg The error message.
   * @param {ErrorCodes} typeCode The error code.
   * @param {string} toFix A string describing how to fix the error. This should ***not*** be too verbose.
   */
  constructor (msg, typeCode, toFix) {
    super(msg)

    this.typeCode = typeCode
    this.toFix = toFix
  }
}

/**
 * @typedef {Object<string, ValidatorFunc>} ValidatorSchema
 * @typedef {"EINVALID"|"EMISSING"|"ELENGTH"|"ENOTAUTH"|"EFAILED"} ErrorCodes
 *
 * @callback ValidatorFunc
 * @param {any} val
 * @returns {true|ValidationError}
 */

/**
 * Returns a function that checks if the given value is a string.
 * @returns {ValidatorFunc}
 */
export function string () {
  return val => {
    if (typeof val !== 'string') {
      return new ValidationError(
        'Value is not a string!', 'EINVALID',
        'Make sure the value is a string.'
      )
    }
    return true
  }
}
/**
 * Returns a function that checks if the given value is valid JSON.
 * @returns {ValidatorFunc}
 */
export function json () {
  return val => {
    try {
      JSON.parse(val)
    } catch (ex) {
      return new ValidationError(
        'Value is not JSON!', 'EINVALID',
        'Make sure the value is valid JSON.'
      )
    }
    return true
  }
}

/**
 * Validates an object.
 * @param {ValidatorSchema} expected The schema for the object.
 * @param {any} obj The object to validate.
 * @returns {true|ValidationError}
 */
export function validateObj (expected, obj) {
  const expectedKeys = Object.keys(expected)
  const expectedKeysLen = expectedKeys.length

  for (let i = 0; i < expectedKeysLen; i++) {
    const key = expectedKeys[i]
    const validator = expected[key]
    const val = obj[key]

    if (!(key in obj)) {
      return new ValidationError(
        `Property ${key} does not exist on input object!`,
        'EMISSING', 'Make sure the key exists on input object.'
      )
    } else if (typeof validator !== 'function') {
      return new ValidationError(
        'Validator is not a function!',
        'EFAILED', 'Pass in the proper validator function.'
      )
    }

    const result = validator(val)
    if (result !== true) {
      return new ValidationError(
        result.message, result.typeCode,
        result.toFix
      )
    }
  }
  return true
}
