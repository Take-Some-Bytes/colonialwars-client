/* eslint-env browser */
/**
 * @fileoverview Functions that help in the manipulation of numbers.
 */

/**
 * Binds a number to the given minimum and maximum, inclusive of both
 * binds. This function will still work if min and max are switched.
 * @param {number} val The value to check.
 * @param {number} min The minimum number to bound to.
 * @param {number} max The maximum number to bound to.
 * @returns {number}
 */
export function bind (val, min, max) {
  if (min > max) { return Math.min(Math.max(val, max), min) }
  return Math.min(Math.max(val, min), max)
}
