/* eslint-env browser */
/**
 * @fileoverview Main App class.
 */

/**
 * DOING: Reworking app structure.
 */

import debugFactory from 'debug'

import constants from '../constants.js'
import EventEmitter from '../helpers/event-emitter.js'

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
 * @prop {ViewportDimensions} vwDimensions
 * @prop {(page: symbol) => void} setPage
 *
 * @typedef {Object} SubApp
 * @prop {(opts: any) => void} initWithOpts
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
export default class App extends EventEmitter {
  /**
   * Create a new App.
   *
   * This sets up some basic properties, but the App is *not ready* to be used
   * right after. The ``app.init()`` method must be called and waited for in
   * order to run a App object.
   */
  constructor () {
    super()

    this.page = AppPages.UNSET
    this.initialized = false

    /** @type {SubApp} */
    this.currentSubApp = null
    /**
     * A cache of all sub-apps.
     * @type {Record<symbol, SubApp>}
     */
    this.subAppCache = {}

    this.vwDimensions = new ViewportDimensions()
  }

  /**
   * Get the SubApp associated with ``this.page``. The SubApp returned is
   * not initialized.
   * @returns {Promise<SubApp>}
   * @private
   */
  async _getSubApp () {
    if (this.page === AppPages.UNSET) {
      // Something's wrong.
      throw new Error('Expected app page to be set!')
    }

    const cachedSubApp = this.subAppCache[this.page]
    if (cachedSubApp) {
      // The sub-app already exists. Use that one.
      return cachedSubApp
    }

    const AppConstructor = await getCurrentSubApp(this.page)
    if (typeof AppConstructor !== 'function') {
      // Something's wrong!
      throw new Error('Invalid sub-app!')
    }

    const subApp = AppConstructor({
      vwDimensions: this.vwDimensions,
      setPage: this.setPage.bind(this)
    })
    this.subAppCache[this.page] = subApp

    return subApp
  }

  /**
   * Sets what page the application is currently on.
   * @param {symbol} page The page to switch to.
   * @param {any} opts Any options to pass to the ``pageChange`` event handler.
   */
  setPage (page, opts) {
    if (this.page === page) {
      // Do nothing
      return
    }

    this.page = page
    this.emit('pageChange', opts)
  }

  /**
   * Initialize this App object.
   */
  init () {
    window.addEventListener('resize', () => {
      this.vwDimensions.update()
    })

    this.on('pageChange', opts => {
      if (this.currentSubApp) {
        this.currentSubApp.stop()
        this.currentSubApp = null
      }

      this._getSubApp()
        .then(subApp => {
          subApp.initWithOpts(opts)
          subApp.start()

          this.currentSubApp = subApp
        })
    })

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

    this.setPage(getCurrentPage(window.location.pathname))
  }
}
