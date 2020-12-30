/* eslint-env browser */
/**
 * @fileoverview Main lobby app class.
 */

import Dialog from '../ui/dialog.js'
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

    /**
     * @type {Object<string, Dialog>}
     */
    this.dialogs = {
      Play: null,
      Settings: null
    }
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
      },
      buttons: {
        Play: ['Next', 'Play']
      }
    }
    this.playDialogState = {
      onSlide: 0
    }
  }

  /**
   * TODO: Fill in the next three functions.
   * Currently, the following three functions are just no-ops-and that's okay...
   * for now. They will have to something in the next version.
   * (12/22/2020) Take-Some-Bytes */

  /**
   * Handles when the player presses the next button.
   * @param {Event} e The event.
   * @private
   */
  _onPlayNext (e) {}

  /**
   * Handles when the player presses the Play button in the play dialog.
   * @param {Event} e The event.
   */
  _onPlay (e) {}

  /**
   * Handles when the game settings gets saved.
   * @param {Event} e The event.
   */
  _onSettingsSave (e) {}

  /**
   * Creates the required dialogs.
   */
  createDialogs () {
    Object.keys(this.dialogs).forEach(name => {
      const dialog = new Dialog({
        width: this.constants.VIEWPORT_WIDTH,
        height: this.constants.VIEWPORT_HEIGHT
      }, name)

      Object.keys(this.confs.baseDialogConf).forEach(confKey => {
        dialog.set(confKey, this.confs.baseDialogConf[confKey])
      })

      dialog
        .set('width', Math.round(this.constants.VIEWPORT_WIDTH / 3))
        .set('height', Math.round(this.constants.VIEWPORT_HEIGHT * 10 / 1.5 / 10))
        .set(
          'x',
          Math.round(this.constants.VIEWPORT_WIDTH / 2) - dialog.get('width') / 2
        ).set(
          'y',
          Math.round(this.constants.VIEWPORT_HEIGHT / 2) - dialog.get('height') / 2
        ).set(
          'title', name
        )

      this.dialogs[name] = dialog
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
   * Sets the current dialog buttons.
   */
  setDialogButtons () {
    Object.keys(this.dialogs).forEach(name => {
      const dialog = this.dialogs[name]

      dialog.setButton(
        'Cancel', e => {
          e.preventDefault()
          dialog.set('show', false)
        }
      )
      if (name === 'Play') {
        // We're on the Play dialog–the buttons matter.
        dialog.setButton(
          this.confs.buttons.Play[this.playDialogState.onSlide],
          this.playDialogState.onSlide === 0
            ? this._onPlayNext.bind(this)
            : this._onPlay.bind(this)
        )
      } else {
        // Settings dialog only has two buttons, and they both stay the same.
        dialog.setButton(
          'Save', this._onSettingsSave.bind(this)
        )
      }
    })
  }

  /**
   * Updates the dialog's dimensions.
   */
  updateDialogDimensions () {
    Object.keys(this.dialogs).forEach(name => {
      const dialog = this.dialogs[name]

      dialog
        .set('width', Math.round(this.constants.VIEWPORT_WIDTH / 3))
        .set('height', Math.round(this.constants.VIEWPORT_HEIGHT * 10 / 1.5 / 10))
        .set('x', Math.round(this.constants.VIEWPORT_WIDTH / 2) - dialog.get('width') / 2)
        .set('y', Math.round(this.constants.VIEWPORT_HEIGHT / 2) - dialog.get('height') / 2)
    })
  }

  /**
   * Registers the event listeners for the lobby application.
   */
  registerEventListeners () {
    ;['Settings', 'Play'].forEach(name => {
      const button = document.querySelector(
        `#${name.toLowerCase()}-href`
      )
      const dialog = this.dialogs[name]

      button.addEventListener('click', e => {
        e.preventDefault()

        dialog.set('show', true)
      })
    })

    window.addEventListener('resize', () => {
      this.constants = constantUtils.getConstants()
      this.updateDialogDimensions()
    })
  }

  /**
   * Runs the lobby app.
   */
  run () {
    this.displayVersion()
    this.createDialogs()
    this.setDialogButtons()
    this.registerEventListeners()
  }
}
