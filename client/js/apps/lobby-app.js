/* eslint-env browser */
/**
 * @fileoverview Main lobby app class.
 */

import Fetcher from '../helpers/fetcher.js'
import PlayDialog from '../components/play-dialog.js'
import SettingsDialog from '../components/settings-dialog.js'

import * as constantUtils from '../constants.js'

/**
 * The lobby application.
 */
export default class LobbyApp {
  /**
   * Constructor.
   */
  constructor () {
    this.constants = constantUtils.getConstants()
    this.fetcher = new Fetcher({
      constants: this.constants
    })

    this.confs = {
      baseDialogConf: {
        renderTarget: document.querySelector('body'),
        show: false,
        isModal: true,
        width: Math.round(this.constants.VIEWPORT_WIDTH / 3),
        height: Math.round(this.constants.VIEWPORT_WIDTH * 10 / 1.5 / 10),
        draggable: true,
        'min-width': 240,
        'min-height': 240
      }
    }
    this.components = {
      playDialog: null,
      settingsDialog: null
    }
  }

  /**
   * Creates the required components for this lobby application.
   */
  createComponents () {
    this.components.playDialog = new PlayDialog({
      constants: this.constants,
      dialogConf: this.confs.baseDialogConf,
      fetcher: this.fetcher
    })
    this.components.settingsDialog = new SettingsDialog({
      constants: this.constants,
      dialogConf: this.confs.baseDialogConf
    })
  }

  /**
   * Displays the game version at the bottom of the content box.
   */
  displayVersion () {
    const footer = document.querySelector('#footer-container')
    const version = document.createElement('a')

    version.href = '/version#pre-alpha'
    version.appendChild(document.createTextNode(`${this.constants.VERSION}.`))
    footer.appendChild(document.createTextNode('Version '))
    footer.appendChild(version)
  }

  /**
   * Updates both dialogs' dimensions.
   */
  updateDialogDimensions () {
    this.components.settingsDialog.updateDimensions()
  }

  /**
   * Registers the event listeners for the lobby application.
   */
  registerEventListeners () {
    window.addEventListener('resize', () => {
      this.constants = Object.assign(
        this.constants, constantUtils.getConstants()
      )
      this.updateDialogDimensions()
    })
  }

  /**
   * Runs the lobby app.
   */
  run () {
    this.displayVersion()
    this.createComponents()
    this.registerEventListeners()
    this.components.playDialog.init()
    this.components.settingsDialog.init()
  }
}
