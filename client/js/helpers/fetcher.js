/* eslint-env browser */
/**
 * @fileoverview Functions that fetch data from back-end servers.
 */

import * as adapters from './adapters.js'

/**
 * @typedef {'arrayBuffer'|'blob'|'formData'|'json'|'text'} BodyTypes
 * @typedef {Object} AvailableServers
 * @prop {Array<AvailableServer>} serversAvailable
 *
 * @typedef {Object} AvailableServer
 * @prop {string} serverName
 * @prop {string} location
 *
 * @typedef {Object} ServerStatus
 * @prop {boolean} serverRunning
 * @prop {boolean} full
 * @prop {number} maxClients
 * @prop {number} currentClients
 *
 * @typedef {Object} Status
 * @prop {string} serverName
 * @prop {ServerStatus} status
 *
 * @typedef {Object} GameMetaObj
 * @prop {string} id
 * @prop {string} mode
 * @prop {string} name
 * @prop {Array<string>} teams
 * @prop {Object} capacity
 * @prop {number} capacity.max
 * @prop {number} capacity.current
 *
 * @typedef {Object} FetcherConfig
 * @prop {string} version
 */

/**
 * Fetcher class.
 */
export default class Fetcher {
  /**
   * Constructor for a Fetcher class.
   * @param {FetcherConfig} config Configurations.
   */
  constructor (config) {
    const { version } = config

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
   * Fetches a resource as the specified type.
   * @param {BodyTypes} type The type to fetch the resposne as. Must be ``arrayBuffer``,
   * ``blob``, ``formData``, ``json``, or ``text``.
   * @param {string} url The URL to fetch the resource as.
   * @returns {Promise<any>}
   */
  async fetchAs (type, url) {
    const res = await this.fetchResource(url)
    if (!res.ok) {
      throw new Error(`Failed to fetch resource with status code ${res.status}!`)
    }
    return await res[type]()
  }

  /**
   * Fetches data about the availabe game servers from the backend.
   * @returns {Promise<AvailableServers>}
   */
  async fetchAvailableServers () {
    try {
      return adapters.httpResponseAdapter(
        await this.fetchAs('json', `${window.location.origin}/xhr?for=serversAvailable`)
      )
    } catch (ex) {
      throw new Error(
        `Failed to fetch available game servers! Error is: ${ex.stack}`
      )
    }
  }

  /**
   * Fetches each of the specified server's status.
   * @param {AvailableServers} servers The servers that we received data about.
   * @returns {Promise<Object<string, Status>>}
   */
  async fetchServersStatus (servers) {
    const statuses = {}
    for (let i = 0; i < servers.serversAvailable.length; i++) {
      const server = servers.serversAvailable[i]

      if (!server) {
        continue
      }

      try {
        statuses[server.serverName] = {
          serverName: server.serverName,
          status: adapters.httpResponseAdapter(
            await this.fetchAs('json', `${server.location}/status-report`)
          )
        }
      } catch (ex) {
        console.error(`Error while fetching ${server.serverName}'s status!`)
        console.error(ex.stack)
        // If the request errors out, it's no huge deal.
        continue
      }
    }

    return statuses
  }

  /**
   * Fetches the list of available games available from the specified server.
   * @param {string} serverOrigin The origin of the server to get the list of games from.
   * @returns {Promise<Array<GameMetaObj>>}
   */
  async fetchGamesListFrom (serverOrigin) {
    try {
      return adapters.httpResponseAdapter(
        await this.fetchAs('json', `${serverOrigin}/games-stats`)
      )
    } catch (ex) {
      throw new Error(
        `Failed to fetch list of available games from ${serverOrigin}.`
      )
    }
  }
}
