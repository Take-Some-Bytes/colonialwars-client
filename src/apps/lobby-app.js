/* eslint-env browser */
/**
 * @fileoverview Main lobby app class.
 */

import debugFactory from 'debug'

import Fetcher from '../helpers/fetcher.js'
import PlayDialog from '../dialogs/play-dialog.js'
// import SettingsDialog from '../components/settings-dialog.js'

import constants from '../constants.js'
import { ErrorDisplayer } from '../helpers/display-utils.js'
import { ImageLoader } from '../helpers/image-helpers.js'

const debug = debugFactory('cw-client:lobby-app')

/**
 * @typedef {import('./app').PlayOpts} PlayOpts
 *
 * @typedef {Object} LayoutComponent
 * @prop {() => Promise<void>} init
 * @prop {() => void} show
 * @prop {() => void} hide
 *
 * @typedef {Object} LobbyAppOptions
 * @prop {import('../helpers/display-utils').ViewportDimensions} vwDimensions
 * @prop {(opts: PlayOpts) => Promise<void>} onPlay
 */

/**
 * The lobby application.
 */
export default class LobbyApp {
  /**
   * Constructor for a LobbyApp class.
   * @param {LobbyAppOptions} opts Options.
   */
  constructor (opts) {
    this.initialized = false
    this.running = false
    /** @type {Array<import('../helpers/fetcher').CWServerStatus>} */
    this.servers = null
    /**
     * Any error that was encountered.
     */
    this.error = null

    this.footerContent = new DocumentFragment()

    this.fetcher = new Fetcher(constants.VERSION)
    this.playDialog = new PlayDialog({
      vwDimensions: opts.vwDimensions,
      play: opts.onPlay,
      getServers: () => {
        return this.servers
      },
      fatalError: (err) => {
        this.error = err
        this._showError(err)
      },
      fetcher: this.fetcher,
      imgLoader: new ImageLoader({
        baseURL: new URL('/imgs/game/previews/', window.location.origin).href
      })
    })
  }

  /**
   * Called when the Play button is clicked.
   * @param {MouseEvent} e
   */
  _onPlayButtonClick (e) {
    e.preventDefault()
    this.playDialog.show()
  }

  /**
   * Shows the error store in ``this.error``.
   * @private
   */
  _showError () {
    // 1: close all dialogs.
    this.playDialog.reset()
    this.playDialog.hide()

    // 2: show the error.
    const errDisplayer = new ErrorDisplayer({
      classes: [],
      elem: document.getElementById('error-message')
    })
    errDisplayer.display(this.error, false)

    // 3: show and hide elements.
    document.getElementById('loading-screen').classList.add('hidden')
    document.getElementById('app-main').classList.add('hidden')
    document.getElementById('error-screen').classList.remove('hidden')
  }

  /**
   * Initializes the lobby app.
   */
  async init () {
    // Step 1: display the version in the footer.
    const footer = this.footerContent
    const version = document.createElement('a')

    version.href = `/version#${constants.RELEASE_STAGE}`
    version.appendChild(document.createTextNode(`${constants.VERSION}.`))
    footer.appendChild(document.createTextNode('Version '))
    footer.appendChild(version)

    // Step 2: bind event listeners.
    this._onPlayButtonClick = this._onPlayButtonClick.bind(this)

    // Step 3: initialize dialogs.
    await this.playDialog.init()

    // Step 4: get servers.
    let servers = null
    try {
      servers = await this.fetcher.fetchCWServers()
    } catch (ex) {
      // Failed to fetch server list.
      console.error(ex.stack)
      this.error = new Error('Failed to fetch server list.')
      this._showError()
    }
    if (Array.isArray(servers)) {
      // fetcher.fetchServerStatus never rejects.
      this.servers = await Promise.all(servers.map(server =>
        this.fetcher.fetchServerStatus(server)
      ))
      if (this.servers.filter(serverInfo => serverInfo.available).length === 0) {
        // Not enough servers!
        console.error('Not enough available servers.')
        this.error = new Error('Not enough servers.')
        this._showError()
      }
    }

    this.initialized = true
    debug('Initialized lobby app')
  }

  /**
   * Runs the lobby application.
   *
   * Does nothing if the lobby application has had an error.
   */
  start () {
    if (this.error instanceof Error) {
      // We had an error.
      return
    }
    if (!this.initialized) {
      throw new Error('Lobby app not initialized!')
    }
    if (this.running) {
      debug('Lobby app already running!')
      return
    }

    // Step 1: hide loading screen.
    const loadingElem = document.getElementById('loading-screen')
    loadingElem.classList.add('hidden')

    // Step 2: show the main and lobby app.
    const appMain = document.getElementById('app-main')
    const lobbyMain = document.getElementById('lobby-main')
    appMain.classList.add('app-main--lobby')
    appMain.classList.remove('hidden')
    lobbyMain.classList.remove('hidden')

    // Step 3: show the version.
    // Since the content of the footer already exists in this.footerContent, we
    // just have to clone the nodes.
    document
      .getElementById('lobby-footer')
      .appendChild(this.footerContent.cloneNode(true))

    // Step 4: attach event listeners.
    document.getElementById('play-button')
      .addEventListener('click', this._onPlayButtonClick)

    this.running = true

    debug('Lobby app started')
  }

  /**
   * Stops and cleans up the lobby application.
   */
  stop () {
    if (!this.running) {
      // Do nothing.
      debug('Lobby app already stopped!')
      return
    }

    // Step 1: hide the main and lobby app.
    const appMain = document.getElementById('app-main')
    const lobbyMain = document.getElementById('lobby-main')
    appMain.classList.remove('app-main--lobby')
    appMain.classList.add('hidden')
    lobbyMain.classList.add('hidden')

    // Step 2: show loading screen.
    const loadingElem = document.getElementById('loading-screen')
    loadingElem.classList.remove('hidden')

    // Step 3: detach event listeners.
    document.getElementById('play-button')
      .removeEventListener('click', this._onPlayButtonClick)

    // Step 4: hide all dialogs.
    this.playDialog.reset()
    this.playDialog.hide()

    this.running = false
    debug('Lobby app stopped')
  }
}
