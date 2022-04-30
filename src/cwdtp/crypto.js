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

/**
 * Returns a Uint8Array of random bytes.
 * @param {number} len How many bytes to generate.
 * @returns {Promise<Uint8Array>}
 */
export function randomBytes (len) {
  //   if (typeof require === 'function') {
  //     // Node.JS mode.
  //     const crypto = require('crypto')
  // return new Promise((resolve, reject) => {
  //   crypto.randomBytes(len, (err, buf) => {
  //     if (err) {
  //       reject(err)
  //       return
  //     }
  //     resolve(buf)
  //   })
  // })
  //   } else if (typeof window !== 'undefined' && window.crypto) {
  //     // Browser mode.
  const buf = new Uint8Array(len)
  return new Promise(resolve => {
    setTimeout(() => {
      window.crypto.getRandomValues(buf)
      resolve(buf)
    })
  })
  //   } else {
  //     throw new Error('Found no functions to generate random bytes!')
  //   }
}

/**
 * Hashs an ArrayBuffer or ArrayBufferView.
 * @param {ArrayBuffer|ArrayBufferView} data The data to hash.
 * @param {'SHA-1'|'SHA-256'|'SHA-384'|'SHA-512'} alg The algorithm to use.
 * @returns {Promise<ArrayBuffer>}
 */
export function hash (data, alg) {
  //   if (typeof require === 'function') {
  //     // Node.JS mode.
  //     const crypto = require('crypto')
  //     const debug = require('debug')('cw-client:crypto')
  //     // We keep this mapping here because the Node.JS crypto API accepts
  //     // different name forms for the same hash algorithm.
  // const algs = {
  //   'SHA-1': 'sha1',
  //   'SHA-256': 'sha256',
  //   'SHA-384': 'sha384',
  //   'SHA-512': 'sha512'
  // }
  // return (async () => {
  //   debug('Creating hash with algorithm %s', alg)
  //   const hash = crypto.createHash(algs[alg])
  //   hash.update(data)
  //   const digest = hash.digest()
  //   return digest.buffer
  // })()
  //   } else if (typeof window !== 'undefined' && window.crypto) {
  //     // Browser mode.
  debug('Creating hash with algorithm %s', alg)
  return window.crypto.subtle.digest(alg, new Uint8Array(data))
  //   } else {
  //     throw new Error('Found no functions to generate hashes!')
  //   }
}
