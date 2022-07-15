/* eslint-env browser */
/**
 * @fileoverview Functions that load data from various sources.
 */

import constants from '../constants.js'

/**
 * @typedef {Record<'serverName'|'location', string>} CWServer
 * @typedef {'teams'|'koth'|'siege'} GameMode
 *
 * @typedef {Object} CWServerStatus
 * @prop {string} name
 * @prop {string} location
 * @prop {boolean} available
 *
 * @typedef {Object} Team
 * @prop {string} name
 * @prop {boolean} full
 *
 * @typedef {Object} GameInfo
 * @prop {string} id
 * @prop {string} name
 * @prop {GameMode} mode
 * @prop {Array<Team>} teams
 * @prop {string} description
 * @prop {Object} capacity
 * @prop {number} capacity.max
 * @prop {number} capacity.current
 */

/**
 * Default fetch configurations.
 * @type {RequestInit}
 */
export const FETCH_CONFIG = {
  mode: 'cors',
  method: 'GET',
  headers: {
    'X-App-Version': String(constants.VERSION),
    'X-Requested-With': 'JavaScript::Fetch-API'
  }
}

/**
 * Loads a resource from the specified URL.
 * @param {string} url The URI to fetch the resource from.
 * @returns {Promise<Response>}
 */
export async function loadFrom (url) {
  const res = await fetch(url, FETCH_CONFIG)
  if (!res.ok) {
    throw new Error(`Request failed with status code ${res.status}.`)
  }

  return res
}

/**
 * Fetches a resource from an URL as JSON.
 * @param {string} url The URL to fetch the resource from.
 * @returns {Promise<Record<string, any>>}
 */
export function loadAsJson (url) {
  return loadFrom(url).then(res => res.json())
}

/**
 * Fetches all Colonial Wars Server locations, regardless of whether it is
 * available or not.
 * @returns {Promise<Array<CWServer>>}
 */
export async function loadCWServers () {
  const url = new URL('/xhr?for=serversAvailable', window.location.origin)
  const res = await loadAsJson(url.href)
  if (res.status !== 'ok') {
    throw new Error(`Failed to fetch servers! Error is: ${res.error.message}`)
  }

  return res.data.serversAvailable
}

/**
 * Fetches a list of all the games that are hosted on the server specified in ``serverUrl``.
 * @param {string} serverUrl The URL of the server to fetch the list of games from.
 * @returns {Promise<Array<GameInfo>>}
 */
export async function loadGamesListFrom (serverUrl) {
  const url = new URL('/games-info', serverUrl)
  const res = await loadAsJson(url.href)
  if (res.status !== 'ok') {
    throw new Error(`Failed to fetch servers! Error is: ${res.error.message}`)
  }

  return res.data
}

/**
 * Fetch the status of a Colonial Wars Server.
 * @param {CWServer} server The server to fetch the status for.
 * @returns {CWServerStatus}
 */
export async function loadServerStatus (server) {
  try {
    const url = new URL('/status-report', server.location)
    const res = await loadAsJson(url.href)
    if (res.status !== 'ok') {
      throw new Error(
        `Failed to fetch server ${server.name}! Error is: ${res.error.message}`
      )
    }
    const report = res.data
    return {
      name: server.serverName,
      location: server.location,
      available: report.serverRunning && !report.full
    }
  } catch (ex) {
    // No big deal. Just assume that the server isn't available.
    console.error(ex)
    return {
      name: server.serverName,
      location: null,
      available: false
    }
  }
}
