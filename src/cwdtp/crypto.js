/* eslint-env browser */
/**
 * @fileoverview Some functions for cryptographic use.
 */

import debugFactory from 'debug'

const debug = debugFactory('cw-client:crypto')

if (typeof window !== 'undefined' && typeof window.crypto !== 'undefined') {
  // Freeze crypto object.
  /**
   * Deep-freezes an object.
   * @param {O} object The object to deep freeze.
   * @returns {Readonly<O>}
   * @template O
   */
  function deepFreeze (object) {
    // Retrieve the property names defined on object.
    const propNames = Object.keys(object)
    // Freeze properties before freezing self.
    for (const name of propNames) {
      const value = object[name]
      if (value && typeof value === 'object') {
        deepFreeze(value)
      }
    }
    return Object.freeze(object)
  }

  deepFreeze(window.crypto)
}

export const algorithms = {
  sha1: 'SHA-1',
  sha256: 'SHA-256',
  sha384: 'SHA-384',
  sha512: 'SHA-512'
}

/**
 * Returns a Uint8Array of random bytes.
 * @param {number} len How many bytes to generate.
 * @returns {Promise<Uint8Array>}
 */
export function randomBytes (len) {
  const buf = new Uint8Array(len)
  return new Promise(resolve => {
    setTimeout(() => {
      window.crypto.getRandomValues(buf)
      resolve(buf)
    })
  })
}

/**
 * Hashs an ArrayBuffer or ArrayBufferView.
 * @param {ArrayBuffer|ArrayBufferView} data The data to hash.
 * @param {string} alg The algorithm to use.
 * @returns {Promise<ArrayBuffer>}
 */
export function hash (data, alg) {
  debug('Creating hash with algorithm %s', alg)

  return window.crypto.subtle.digest(alg, new Uint8Array(data))
}
