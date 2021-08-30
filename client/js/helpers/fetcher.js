/* eslint-env browser */
/**
 * @fileoverview Functions that fetch data from back-end servers.
 */

/**
 * @typedef {Record<'serverName'|'location', string>} CWServer
 * @typedef {'teams'|'koth'|'siege'} GameMode
 *
 * @typedef {Object} CWServerStatus
 * @prop {string} name
 * @prop {string} location
 * @prop {boolean} available
 *
 * @typedef {Object} GameInfo
 * @prop {string} id
 * @prop {string} name
 * @prop {GameMode} mode
 * @prop {Array<string>} teams
 * @prop {string} description
 * @prop {Object} capacity
 * @prop {number} capacity.max
 * @prop {number} capacity.current
 */

/**
 * Rejects if the response passed in was not sucessful.
 * @param {Response} res The response.
 * @returns {Response}
 */
function rejectIfNotSucessful (res) {
  if (!res.ok) {
    throw new Error(`Request failed with status code ${res.status}.`)
  }

  return res
}

/**
 * Fetcher class.
 */
export default class Fetcher {
  /**
   * Constructor for a Fetcher class.
   * @param {string} version The current app version.
   */
  constructor (version) {
    this.version = version
  }

  /**
   * Fetches a resource from the specified URL. Only rejects when fetch rejects,
   * never on an unsuccessful response status.
   * @param {string} url The URI to fetch the resource from.
   * @returns {Promise<Response>}
   */
  async fetchResource (url) {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-App-Version': String(this.version),
        'X-Is-Trusted': '1',
        'X-Requested-With': 'JavaScript::Fetch-API'
      },
      credentials: 'include'
    })

    return res
  }

  /**
   * Fetches a resource from an URL as JSON. Rejects if response body is not
   * valid JSON, the response status was non-sucessful, or if the ``fetch()``
   * function rejects.
   * @param {string} url The URL to fetch the resource from.
   * @returns {Promise<Record<string, any>>}
   */
  async fetchAsJson (url) {
    const res = await this.fetchResource(url)
    const res1 = rejectIfNotSucessful(res)
    return await res1.json()
  }

  /**
   * Fetches all Colonial Wars Server locations, regardless of whether it is
   * available or not.
   * @returns {Promise<Array<CWServer>>}
   */
  async fetchCWServers () {
    const url = new URL('/xhr?for=serversAvailable', window.location.origin)
    const res = await this.fetchAsJson(url.href)
    if (res.status !== 'ok') {
      throw new Error(`Failed to fetch servers! Error is: ${res.error.message}`)
    }

    return res.data.serversAvailable
  }

  /**
   * Fetches a list of all the games that are hosted on the server specified in
   * ``serverUrl``.
   * @param {string} serverUrl The URL of the server to fetch the list of games
   * from.
   * @returns {Promise<Array<GameInfo>>}
   */
  async fetchGamesListFrom (serverUrl) {
    const url = new URL('/games-info', serverUrl)
    const res = await this.fetchAsJson(url.href)
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
  async fetchServerStatus (server) {
    try {
      const url = new URL('/status-report', server.location)
      const res = await this.fetchAsJson(url.href)
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
      console.error(ex.stack)
      return {
        name: server.serverName,
        location: null,
        available: false
      }
    }
  }
}
