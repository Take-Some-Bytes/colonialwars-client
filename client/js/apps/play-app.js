/* eslint-env browser */
/**
 * @fileoverview PlayApp class to handle application logic while playing the game.
 */

import debugFactory from '../debug.js'
import constants from '../constants.js'
import Game from '../game/game.js'
import WSConn from '../cwdtp/conn.js'

import { ErrorDisplayer } from '../helpers/display-utils.js'

const { COMMUNICATIONS: communications } = constants
const debug = debugFactory('colonialwars:play-app')
/**
 * Returns the localStorage object if available. Otherwise,
 * returns undefined.
 * @returns {Storage|undefined}
 */
const getStorage = () => {
  if (window.localStorage) {
    return window.localStorage
  }
  return undefined
}

/**
 * @typedef {Object} PlayAppOptions
 * @prop {string} auth
 * @prop {string} gameID
 * @prop {string} serverLoc
 * @prop {string} playername
 * @prop {string} playerteam
 * @prop {import('../helpers/display-utils').ViewportDimensions} viewportDimensions
 *
 * @typedef {Object} MapData
 * @prop {Readonly<import('../game/game').WorldLimits>} worldLimits
 * @prop {{}} staticMapElems
 * @prop {'grass'|'sand'} mapTheme
 */

/**
 * The play application
 */
export default class PlayApp {
  /**
   * Constructor for a play app. This class handles the actual Colonial Wars
   * game logic.
   * @param {PlayAppOptions} opts Options.
   */
  constructor (opts) {
    this.conn = null
    this.game = null
    /**
     * @type {HTMLCanvasElement}
     */
    this.canvas = null
    this.connected = false

    this.viewportDimensions = opts.viewportDimensions
    this.url = new URL(opts.serverLoc)
    this.query = new URLSearchParams({
      auth: opts.auth,
      game: opts.gameID,
      playername: opts.playername,
      playerteam: opts.playerteam
    })

    this.errDisplayer = new ErrorDisplayer({
      classes: [],
      elem: document.body
    })
  }

  /**
   * Creates the CWDTP connection.
   * @returns {Promise<void>}
   * @private
   */
  _connect () {
    return new Promise((resolve, reject) => {
      const secure = this.url.protocol === 'https:'
      const self = this
      this.conn = new WSConn(
        `${secure ? 'wss' : 'ws'}://${this.url.host}/play?${this.query.toString()}`
      )
      this.conn.on('connect', () => {
        resolve()
      })
      this.conn.on('error', function onError (err) {
        reject(err)
        self.conn.removeListener('error', onError)
      })
    })
  }

  /**
   * Initializes the game canvas.
   * @private
   */
  _initCanvas () {
    this.canvas = document.getElementById('game-canvas')

    if (!this.canvas || !(this.canvas instanceof HTMLCanvasElement)) {
      throw new TypeError('Invalid game canvas!')
    }

    this.canvas.width = this.viewportDimensions.width
    this.canvas.height = this.viewportDimensions.height
    this.canvas.style.display = 'block'

    this.viewportDimensions.on('update', () => {
      this.canvas.width = this.viewportDimensions.width
      this.canvas.height = this.viewportDimensions.height
    })
  }

  /**
   * Emits the "ready" event to tell the server that we're ready.
   * Also returns some data the client will need to run the game.
   * @returns {Promise<MapData>}
   * @private
   */
  _emitReady () {
    return new Promise((resolve, reject) => {
      const readyAckTimeout = setTimeout(() => {
        reject(new Error('Ready acknowledgement timeout!'))
      }, 10000)

      this.conn.emit(communications.CONN_READY)
      this.conn.on(communications.CONN_READY_ACK, mapData => {
        clearTimeout(readyAckTimeout)
        debug('%O', mapData)
        resolve({
          worldLimits: Object.freeze(mapData.worldBounds),
          staticMapElems: mapData.static,
          mapTheme: mapData.mapTheme
        })
      })
    })
  }

  /**
   * Get's the client's current key bindings.
   * @returns {import('../game/game.js').GameKeyBindings}
   * @private
   */
  _getKeyBindings () {
    /**
     * @type {import('../game/game.js').GameKeyBindings}
     */
    let bindings = null
    const storage = getStorage()
    if (!storage) {
      return constants.GAME_CONSTANTS.DEFAULT_KEY_BINDINGS
    }

    const item = storage.getItem('key-bindings')
    if (!item) {
      bindings = constants.GAME_CONSTANTS.DEFAULT_KEY_BINDINGS
    } else {
      bindings = JSON.parse(item)
    }

    return bindings
  }

  /**
   * Initializes the Game class that is going to handle actual game logic.
   * @private
   */
  async _initGame () {
    const keyBindings = this._getKeyBindings()
    const mapData = await this._emitReady()
    this.game = await Game.create(
      this.canvas.getContext('2d'), this.conn,
      mapData, keyBindings, this.viewportDimensions
    )

    debug(this.game)
  }

  /**
   * Initializes the play app.
   * @returns {Promise<PlayApp>}
   */
  async init () {
    await this._connect().catch(err => {
      console.error(err)
      this.errDisplayer.display(new Error('Failed to connect to server!'))
    })
    this._initCanvas()
    await this._initGame()
    debug('Initialized')

    return this
  }

  /**
   * Runs this play app.
   */
  run () {
    this.game.run()
  }
}
