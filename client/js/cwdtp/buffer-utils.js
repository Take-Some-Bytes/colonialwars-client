/* eslint-env browser */
/**
 * @fileoverview Utility functions to mess with buffers.
 */

/**
 * @typedef {Int8Array|Int16Array|Int32Array} IntArrays
 * @typedef {Uint8Array|Uint8ClampedArray|Uint16Array|Uint32Array} UintArrays
 * @typedef {Float32Array|Float64Array} FloatArrays
 * @typedef {BigInt64Array|BigUint64Array} BigIntArrays
 *
 * @typedef {IntArrays|UintArrays|FloatArrays|BigIntArrays} TypedArrays
 */

/**
 * Converts a string to a Uint32Array, if ``useCodePoint`` is true (since
 * unicode code points are 32 bit unsigned integers), otherwise converts the
 * string into a Uint16Array.
 * @param {string} str The string to convert.
 * @param {boolean} useCodePoint Whether to use Unicode code points.
 * @returns {Uint32Array|Uint16Array}
 */
export function toBinary (str, useCodePoint) {
  const getCode = useCodePoint
    ? String.prototype.codePointAt
    : String.prototype.charCodeAt

  if (useCodePoint) { return new Uint32Array([...str].map((_, i) => getCode.call(str, i))) }
  return new Uint16Array(str.split('').map((_, i) => getCode.call(str, i)))
}

/**
 * Converts a Uint32Array or a Uint16Array into a JS string.
 * @param {Uint32Array|Uint16Array} bin The Uint32Array or Uint16Array to convert to a string.
 * @param {boolean} useCodePoint Whether to use Unicode code points.
 * @returns {string}
 */
export function toString (bin, useCodePoint) {
  const toChar = useCodePoint
    ? String.fromCodePoint
    : String.fromCharCode
  const decodedArr = []

  for (const byte of bin) {
    decodedArr.push(toChar(byte))
  }

  return decodedArr.join('')
}

/**
 * Converts a buffer to a base64 string.
 * @param {TypedArrays|ArrayBuffer} buf The buffer to convert to base64.
 * @returns {string}
 */
export function toBase64 (buf) {
  let bytes = null
  if (buf instanceof ArrayBuffer) {
    bytes = new Uint8Array(buf)
  } else if (buf.buffer) {
    // Assume it is a typed array. If it is not, welp, this will fail.
    bytes = new Uint8Array(buf.buffer)
  } else {
    throw new TypeError('Invalid buffer parameter!')
  }

  return window.btoa(toString(bytes, false))
}

/**
 * Concatenates a bunch of JS buffers, and returns a new Uint8Array. Will return null
 * if the buffers argument holds no typed arrays. Will return the first buffer converted
 * to a Uint8Array if there is only one buffer.
 * @param {...TypedArrays} buffers The buffers to concatenate.
 * @returns {Uint8Array}
 */
export function concatBuffers (...buffers) {
  let len = 0
  let offset = 0
  if (!buffers.every(buf => ArrayBuffer.isView(buf) && !(buf instanceof DataView))) {
    throw new TypeError('All buffers must be TypedArrays. No DataViews!')
  }
  if (buffers.length < 2) {
    return new Uint8Array(buffers[0].buffer) || null
  }

  for (const buf of buffers) {
    len += buf.byteLength
  }
  const result = new Uint8Array(len)
  for (const buf of buffers) {
    result.set(new Uint8Array(buf.buffer), offset)
    offset += buf.byteLength
  }

  return result
}
