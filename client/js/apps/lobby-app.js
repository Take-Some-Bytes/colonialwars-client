/* eslint-env browser */
/**
 * @fileoverview Main lobby app class.
 */

import Fetcher from '../helpers/fetcher.js'
import PlayDialog from '../components/play-dialog.js'
import SettingsDialog from '../components/settings-dialog.js'

import constants from '../constants.js'

/**
 * @callback PlayerReadyHandler
 * @param {PlayData} playData
 * @returns {void|Promise<void>}
 *
 * @typedef {Object} PlayData
 * @prop {string} playerName
 * @prop {string} playerTeam
 * @prop {string} gameID
 * @prop {string} serverLoc
 * @prop {string} auth
 *
 * @typedef {Object} LobbyAppOptions
 * @prop {import('../helpers/display-utils').ViewportDimensions} viewportDimensions
 * @prop {PlayerReadyHandler} onPlayerReady
 * @prop {Record<string, any>} previewMeta
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
    const {
      previewMeta,
      onPlayerReady,
      viewportDimensions
    } = opts

    this.fetcher = new Fetcher({
      version: constants.VERSION
    })

    this.confs = {
      baseDialogConf: {
        renderTarget: document.querySelector('body'),
        show: false,
        isModal: true,
        width: Math.round(viewportDimensions.height / 3),
        height: Math.round(viewportDimensions.width * 10 / 1.5 / 10),
        draggable: true,
        'min-width': 240,
        'min-height': 240
      }
    }
    this.components = {
      playDialog: null,
      settingsDialog: null
    }
    this.previewMeta = previewMeta

    this.viewportDimensions = viewportDimensions
    this.onPlayerReady = onPlayerReady
  }

  /**
   * Creates the required components for this lobby application.
   */
  createComponents () {
    this.components.playDialog = new PlayDialog({
      previewsPaths: this.previewMeta.previewLocations,
      viewportDimensions: this.viewportDimensions,
      dialogConf: this.confs.baseDialogConf,
      onPlayerReady: this.onPlayerReady,
      fetcher: this.fetcher
    })
    this.components.settingsDialog = new SettingsDialog({
      viewportDimensions: this.viewportDimensions,
      dialogConf: this.confs.baseDialogConf,
      constants: this.constants
    })
  }

  /**
   * Displays the game version at the bottom of the content box.
   */
  displayVersion () {
    const footer = document.querySelector('#footer-container')
    const version = document.createElement('a')

    version.href = '/version#pre-alpha'
    version.appendChild(document.createTextNode(`${constants.VERSION}.`))
    footer.appendChild(document.createTextNode('Version '))
    footer.appendChild(version)
  }

  /**
   * Initializes the lobby app.
   */
  init () {
    this.displayVersion()
    this.createComponents()
    this.components.playDialog.init()
    this.components.settingsDialog.init()
  }

  /**
   * Shows the lobby app.
   */
  show () {
    const main = document.querySelector('#content-container')

    if (main instanceof HTMLElement) {
      main.style.display = 'block'
    }
  }

  /**
   * Hides the lobby app.
   */
  hide () {
    const main = document.querySelector('#content-container')

    if (main instanceof HTMLElement) {
      main.style.display = 'none'
    }

    Object.values(this.components).forEach(comp => {
      comp.hide()
    })
  }
}
