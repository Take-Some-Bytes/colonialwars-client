/* eslint-env browser */
/**
 * @fileoverview Main App class.
 */

import constants from '../constants.js'
import debugFactory from '../debug.js'

import { ViewportDimensions } from '../helpers/display-utils.js'

const debug = debugFactory('cw-client:main-app')

/**
 * @typedef {Object} PlayOpts
 * @prop {string} auth
 * @prop {string} gameID
 * @prop {string} serverLoc
 * @prop {string} playerName
 * @prop {string} playerTeam
 *
 * @typedef {Object} SubAppOpts
 * @prop {(opts: PlayOpts) => Promise<void>} [onPlay]
 * @prop {ViewportDimensions} vwDimensions
 * @prop {() => Promise<void>} [onQuit]
 * @prop {PlayOpts} [playOpts]
 *
 * @typedef {Object} SubApp
 * @prop {() => Promise<void>} init
 * @prop {() => void} start
 * @prop {() => void} stop
 *
 * @typedef {new (opts: SubAppOpts) => SubApp} SubAppConstructor
 * @typedef {'lobby'|'play'} SubAppNames
 */

const AppPages = constants.APP_PAGES

/** @type {SubAppConstructor} */
let LobbyApp = null
/** @type {SubAppConstructor} */
let PlayApp = null

/**
 * Get the symbol for the current page.
 * @param {string} path The current path.
 * @returns {symbol}
 */
function getCurrentPage (path) {
  switch (path) {
    case '/':
      return AppPages.LOBBY
    default:
      return AppPages.UNSET
  }
}
/**
 * Get the SubApp class for the current page.
 * @param {symbol} page The symbol of the current page.
 * @returns {Promise<SubAppConstructor>}
 */
async function getCurrentSubApp (page) {
  switch (page) {
    case AppPages.LOBBY:
      if (!LobbyApp) {
        LobbyApp = (await import('./lobby-app.js')).default
      }
      return LobbyApp
    case AppPages.PLAY:
      if (!PlayApp) {
        PlayApp = (await import('./play-app.js')).default
      }
      return PlayApp
    default:
      return null
  }
}

/**
 * Main App class.
 */
export default class App {
  /**
   * Create a new App.
   *
   * This sets up some basic properties, but the App is *not ready* to be used
   * right after. The ``app.init()`` method must be called and waited for in
   * order to run a App object.
   */
  constructor () {
    this.page = AppPages.UNSET
    this.initialized = false
    /** @type {SubApp} */
    this.currentSubApp = null
    this.playOpts = {
      auth: null,
      gameID: null,
      serverLoc: null,
      playerName: null,
      playerTeam: null
    }
    /**
     * A cache of all sub-apps.
     * @type {Record<symbol, SubApp>}
     */
    this.subAppCache = {}

    this.vwDimensions = new ViewportDimensions()
  }

  /**
   * Handler for when the client decides to start playing.
   * @param {PlayOpts} opts Play options.
   * @private
   */
  async _onPlay (opts) {
    debug('Client wants to play')
    this.playOpts = Object.assign(this.playOpts, opts)
    // const gameInfo = JSON.parse(opts)

    await this._updateSubApp(AppPages.PLAY)
    this.run()
  }

  /**
   * Set ``app.page`` to ``page`` and fetch the SubApp associated with it.
   * @param {symbol} page The current page.
   * @private
   */
  async _updateSubApp (page) {
    this.page = page
    if (this.page === AppPages.UNSET) {
      // Something's wrong.
      throw new Error('Expected app page to not be unset!')
    }
    // Stop the currrent sub app if needed.
    if (this.currentSubApp) {
      this.currentSubApp.stop()
    }

    const cachedSubApp = this.subAppCache[this.page]
    if (cachedSubApp) {
      // The sub-app already exists. Use that one.
      this.currentSubApp = cachedSubApp
      return
    }

    const AppConstructor = await getCurrentSubApp(this.page)
    if (typeof AppConstructor !== 'function') {
      // Something's wrong!
      throw new Error('Invalid sub-app!')
    }

    this.currentSubApp = new AppConstructor({
      vwDimensions: this.vwDimensions,
      onPlay: this._onPlay.bind(this),
      playOpts: this.playOpts
    })
    await this.currentSubApp.init()

    // Cache the sub-app.
    this.subAppCache[this.page] = this.currentSubApp
  }

  /**
   * Initialize this App object.
   */
  async init () {
    window.addEventListener('resize', () => {
      this.vwDimensions.update()
    })

    await this._updateSubApp(getCurrentPage(location.pathname))

    this.initialized = true
    debug('Initialized main JS app')
  }

  /**
   * Run this App object.
   */
  run () {
    if (!this.initialized) {
      throw new Error('Main app not initialized!')
    }

    this.currentSubApp.start()
  }
}
