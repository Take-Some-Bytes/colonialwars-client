/* eslint-env browser */
/**
 * @fileoverview Just a few functions to make current expected data
 * parsing work with new and improved data structures.
 */

/**
 * @typedef {Object} HTTPResponseBody
 * @prop {"ok"|"error"} status
 * @prop {Record<string, any>} [error]
 * @prop {Record<string, any>} [data]
 */

/**
 * This adapter adapts the newer data structures to the older, expected data structures.
 * @param {HTTPResponseBody} resBody The response returned by the response.
 * @returns {Record<string, any>}
 */
export function httpResponseAdapter (resBody) {
  if (resBody.status !== 'ok') {
    throw new Error('Status is not OK!')
  } else if (!resBody.data && !resBody.error) {
    throw new TypeError('Missing data fields!')
  }

  // Literately just one line.
  return resBody.data
}
