/* eslint-env browser */
/**
 * @fileoverview PlayApp class to handle application logic while playing the game.
 */

import { WSConn } from 'colonialwars-lib/cwdtp'

import debugFactory from 'debug'
import constants from '../constants.js'
import Game from '../game/game.js'
import * as crypto from '../cwdtp/crypto.js'

import { ErrorDisplayer } from '../helpers/display-utils.js'

const { COMMUNICATIONS: communications } = constants
const debug = debugFactory('cw-client:play-app')

/**
 * Returns the localStorage object if available. Otherwise,
 * returns undefined.
 * @returns {Storage|undefined}
 */
function getStorage () {
  if (window.localStorage) {
    return window.localStorage
  }
  return undefined
}
/**
 * Get's the client's current key bindings.
 * @returns {import('../game/game.js').GameKeyBindings}
 */
function getKeyBindings () {
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
 * @typedef {import('./app').PlayOpts} PlayOpts
 * @typedef {Record<'x'|'y'|'w'|'h', number>} StaticImage
 * @typedef {Record<'x'|'y'|'w'|'h'|'frameSize', number>} DynAnimation
 * @typedef {'mainImg'|'damaged1Img'|'damaged2Img'|'constructing1Img'} StaticImgKeys
 * @typedef {'die'|'idle'|'walk'|'attack'|'reload'|'busy'|
 * 'cast'|'busyDamaged1'|'busyDamaged2'} DynAnimationKeys
 *
 * @typedef {Object} PlayAppOptions
 * @prop {import('../helpers/display-utils').ViewportDimensions} vwDimensions
 * @prop {(page: symbol, opts: any) => void} setPage
 *
 * @typedef {Object} Graphic
 * @prop {string} id
 * @prop {string} name
 * @prop {string} file
 * @prop {number} angles
 * @prop {boolean} hasAnimations
 * @prop {StaticImage} mainImg
 * @prop {StaticImage} damaged1Img
 * @prop {StaticImage} damaged2Img
 * @prop {StaticImage} constructing1Img
 * @prop {Record<DynAnimationKeys, DynAnimation>} animations
 *
 * @typedef {Object} MapData
 * @prop {Array<any>} obstacles
 * @prop {Array<any>} decorations
 * @prop {'grass'|'sand'} tileType
 * @prop {Record<string, Graphic>} graphicsData
 * @prop {Readonly<import('../game/game').WorldLimits>} worldLimits
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
    this.error = null

    this.vwDimensions = opts.vwDimensions
  }

  /**
   * Shows the error store in ``this.error``.
   * @private
   */
  _showError () {
    // 1: show the error.
    const errDisplayer = new ErrorDisplayer({
      classes: [],
      elem: document.getElementById('error-message')
    })
    errDisplayer.display(this.error, false)

    // 2: show and hide elements.
    document.getElementById('loading-screen').classList.add('hidden')
    document.getElementById('app-main').classList.add('hidden')
    document.getElementById('error-screen').classList.remove('hidden')
  }

  /**
   * Creates a CWDTP connection to the server.
   * @param {string} url The URl to connect to.
   * @returns {Promise<void>}
   * @private
   */
  _connect (url) {
    const self = this

    return new Promise((resolve, reject) => {
      this.conn = new WSConn(url, {
        crypto,
        pingTimeout: 30 * 1000,
        createWs: (...args) => new WebSocket(...args)
      })
      this.conn.on('open', () => {
        debug('Connection opened')
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

    this.canvas.width = this.vwDimensions.width
    this.canvas.height = this.vwDimensions.height
    this.canvas.style.display = 'block'

    this.vwDimensions.on('update', () => {
      this.canvas.width = this.vwDimensions.width
      this.canvas.height = this.vwDimensions.height
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

      this.conn.send(communications.CONN_READY)
      this.conn.messages.on(communications.CONN_READY_ACK, mapData => {
        clearTimeout(readyAckTimeout)
        debug('Map data: %O', mapData)
        resolve(mapData)
      })
    })
  }

  /**
   * Initializes the play app.
   * @param {PlayOpts} opts Play options.
   * @returns {Promise<void>}
   */
  async initWithOpts (opts) {
    this.playOpts = opts
  }

  /**
   * Starts this Play application.
   */
  start () {
    // Step 1: construct connection URL and query.
    let connectQuery = null
    let connectUrl = null

    try {
      connectQuery = new URLSearchParams({
        auth: this.playOpts.auth,
        game: this.playOpts.gameID,
        playername: this.playOpts.playerName,
        playerteam: this.playOpts.playerTeam
      })
      connectUrl = new URL(
        `/play?${connectQuery.toString()}`, this.playOpts.serverLoc
      )
      connectUrl.protocol = connectUrl.protocol === 'https:'
        ? 'wss:'
        : 'ws:'
    } catch (ex) {
      console.error(ex)
      this.error = new Error('Something went wrong. Please try again later.')
      this._showError()
      return
    }

    // Step 2: connect to the server.
    this._connect(connectUrl.href)
      .then(() => this._initCanvas())
      .then(() => this._emitReady())
      .then(mapData => {
        return Game.create({
          context: this.canvas.getContext('2d'),
          vwDimensions: this.vwDimensions,
          conn: this.conn,
          mapData
        })
      })
      .then(game => { this.game = game })
      .then(() => this.game.start())
      .then(() => {
        // Hide loading screen.
        const loadingElem = document.getElementById('loading-screen')
        loadingElem.classList.add('hidden')

        // Show the main and play app.
        const appMain = document.getElementById('app-main')
        const playMain = document.getElementById('play-main')
        appMain.classList.add('app-main--play')
        appMain.classList.remove('hidden')
        playMain.classList.remove('hidden')
      })
  }

  /**
   * Stops this Play application.
   */
  stop () {
    this.game.stop()
  }
}
