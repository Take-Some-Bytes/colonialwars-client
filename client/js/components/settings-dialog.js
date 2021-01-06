/* eslint-env browser */
/**
 * @fileoverview SettingsDialog class to manage the ``Settings``
 * dialog component of the lobby page.
 */

import Dialog from '../ui/dialog.js'

/**
 * @typedef {Object} SettingsDialogConfig
 * @prop {Object<string, any>} dialogConf
 * @prop {import('../constants').ClientConstants} constants
 */

/**
 * DOING: Moving the code for the Settings dialog to this component.
 * Please ignore the linting errors.
 * (02/01/2021) Take-Some-Bytes */
/**
 * SettingsDialog component/class.
 */
export default class SettingsDialog {
  /**
   * Constructor for a SettingsDialog component/class.
   * @param {SettingsDialogConfig} config Configurations.
   */
  constructor (config) {
    const { dialogConf, constants } = config

    this.dialogConf = dialogConf
    this.constants = constants

    this._dialog = null
    this.name = 'Settings'
  }

  /**
   * Handler for when the ``Save`` button is pressed.
   * @param {Event} e The DOM event that happened.
   * @private
   */
  _onSave (e) {}

  /**
   * Initializes this component's actual dialog.
   */
  initDialog () {
    this._dialog = Dialog.create(this.constants, this.name, this.dialogConf)
  }

  /**
   * Sets this dialog's buttons.
   */
  setDialogButtons () {
    this._dialog.setButton('Cancel', e => {
      e.preventDefault()
      this._dialog.set('show', false)
    })
    this._dialog.setButton('Save', this._onSave.bind(this))
  }

  /**
   * Registers this component's required event listeners.
   */
  registerEventListeners () {
    const button = document.querySelector('#settings-href')
    const dialog = this._dialog

    button.addEventListener('click', e => {
      e.preventDefault()

      dialog.set('show', true)
    })
  }

  /**
   * Updates this dialog's dimensions.
   */
  updateDimensions () {
    if (!(this._dialog instanceof Dialog)) {
      // No-op if this component's dialog is not yet initialized
      return
    }
    this._dialog
      .set('width', Math.round(this.constants.VIEWPORT_WIDTH / 3))
      .set('height', Math.round(this.constants.VIEWPORT_HEIGHT * 10 / 1.5 / 10))
      .set('x', Math.round(this.constants.VIEWPORT_WIDTH / 2) - this._dialog.get('width') / 2)
      .set('y', Math.round(this.constants.VIEWPORT_HEIGHT / 2) - this._dialog.get('height') / 2)
  }

  /**
   * Renders this component.
   * @returns {Dialog}
   */
  render () {
    return this._dialog.render()
  }

  /**
   * Initializes this component.
   */
  init () {
    this.initDialog()
    this.setDialogButtons()
    this.registerEventListeners()
  }
}
