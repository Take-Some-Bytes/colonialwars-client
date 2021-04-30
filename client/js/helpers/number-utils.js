/* eslint-env browser */
/**
 * @fileoverview Functions that help in the manipulation of numbers.
 */

/**
 * Bounds a number to a minimum and maximum. This function
 * will still work if min and max are switched (i.e. min is larger than max).
 * @param {number} val The value to bound.
 * @param {number} min The minimum bound.
 * @param {number} max The maximum bound.
 * @returns {number}
 */
export function bound (val, min, max) {
  if (min > max) return Math.min(min, Math.max(max, val))
  return Math.min(max, Math.max(min, val))
}
/**
 * Returns a boolean representing whether the given value is between the minimum
 * and maximum, inclusive of both bounds. This function will still work if
 * ``min`` and ``max`` are switched.
 * @param {number} val The value to check.
 * @param {number} min The minimum bound.
 * @param {number} max The maximum bound.
 */
export function inBound (val, min, max) {
  if (min > max) { return val >= max && val <= min }
  return val >= min && val <= max
}
/**
 * Finds all the divisors (i.e. factors) of num.
 * @param {number} num The number to find all the divisors of.
 * @returns {Array<number>}
 */
export function findAllDivisors (num) {
  let divisors = []

  for (let i = 0, stop = Math.sqrt(num); i < stop; i++) {
    if (num % i === 0) {
      if (i === num / i) {
        divisors.push(i)
      } else {
        divisors.push(i, num / i)
      }
    }
  }

  // Sort the divisors from least to greatest.
  divisors = divisors
    // All values sorted must be a number, not NaN and not Infinity.
    .filter(val => typeof val === 'number' && !isNaN(val) && isFinite(val))
    .sort((a, b) => a - b)

  return divisors
}
