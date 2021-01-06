/* eslint-env browser */
/**
 * @fileoverview Functions that fetch data from back-end servers.
 */

/**
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
 * @typedef {Object} FetchersConfig
 * @prop {import('../constants').ClientConstants} constants
 */

/**
 * Fetchers class.
 */
export default class Fetchers {
  /**
   * Constructor for a Fetchers class.
   * @param {FetchersConfig} config Configurations.
   */
  constructor (config) {
    const { constants } = config

    this.constants = constants
  }

  /**
   * Fetches data about the availabe game servers from the backend.
   * @returns {Promise<AvailableServers>}
   */
  async fetchAvailableServers () {
    const version = String(this.constants.VERSION)
    const res = await fetch(`${window.location.origin}/xhr?for=serversAvailable`, {
      method: 'GET',
      headers: {
        'X-App-Version': version,
        'X-Is-Trusted': '1',
        'X-Requested-With': 'JavaScript::Fetch-API'
      }
    })
    if (!res.ok) {
      throw new Error(
        'Failed to fetch available game servers!'
      )
    }

    return await res.json()
  }

  /**
   * Fetches each of the specified server's status.
   * @param {AvailableServers} servers The servers that we received data about.
   * @returns {Promise<Object<string, Status>>}
   */
  async fetchServersStatus (servers) {
    const statuses = {}
    const version = String(this.constants.VERSION)
    for (let i = 0; i < servers.serversAvailable.length; i++) {
      const server = servers.serversAvailable[i]

      if (!server) {
        continue
      }

      try {
        const res = await fetch(`${server.location}/status-report`, {
          method: 'GET',
          headers: {
            'X-App-Version': version,
            'X-Is-Trusted': '1',
            'X-Requested-With': 'JavaScript::Fetch-API'
          }
        })
        if (!res.ok) {
          throw new Error('Failed to fetch server status!')
        }

        statuses[server.serverName] = {
          serverName: server.serverName,
          status: await res.json()
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
}