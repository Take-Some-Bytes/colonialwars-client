/* eslint-env browser */
/**
 * @fileoverview PlayDialog component to manage the ``Play`` dialog rendering
 * and state.
 */

import Dialog from '../ui/dialog.js'
import SelectMenu from '../ui/selectmenu.js'

import * as validator from '../validation/validator.js'

import { playInputSchemas } from '../validation/schemas.js'
import { removeAllChildNodes } from '../helpers/dom-helpers.js'

/**
 * @typedef {Object} PlayDialogConfig
 * @prop {Object<string, any>} dialogConf
 * @prop {import('../helpers/fetcher').default} fetcher
 * @prop {import('../constants').ClientConstants} constants
 */

/**
 * PlayDialog class/component.
 */
export default class PlayDialog {
  /**
   * Constructor for a PlayDialog class.
   * @param {PlayDialogConfig} config Configurations.
   */
  constructor (config) {
    const {
      dialogConf, fetcher, constants
    } = config

    this.schemas = playInputSchemas
    this.dialogConf = dialogConf
    this.fetcher = fetcher
    this.constants = constants

    this.buttons = ['Next', 'Play']
    this.state = {
      onSlide: 0
    }
    this.name = 'Play'

    this._dialog = null
  }

  /**
   * Handles when the client clicks the ``Next`` button.
   * @param {Event} e The DOM event that happened.
   * @private
   */
  _onNext (e) {
    const errorSpan = document.querySelector('#error-span')
    let tempData = null

    removeAllChildNodes(errorSpan)
    e.preventDefault()

    const data = {
      playerName: document.querySelector('#name-input').value,
      server: (
        tempData = document.querySelector('#select-server option:checked')
      ) !== null
        ? tempData.value
        : null
    }
    const error = validator.validateObj(this.schemas[0], data)
    if (error instanceof validator.ValidationError) {
      errorSpan.classList.add('error')
      errorSpan.appendChild(document.createTextNode(
        `${error.message}\nTo fix this issue, ${error.toFix.toLowerCase()}`
      ))
      return
    }

    console.log(data)
    console.log(JSON.parse(data.server))
  }

  /**
   * Handles when the client clicks the ``Play`` button.
   * @param {Event} e The DOM event that happened.
   * @private
   */
  _onPlay (e) {}

  /**
   * Gets the selectmenu for the first Play dialog form.
   * @param {string} id The ID of the selectmenu.
   * @returns {SelectMenu}
   * @private
   */
  _getSelectMenu (id) {
    if (this.selectmenu instanceof SelectMenu &&
      `#${this.selectmenu.selectmenu.id}` === id
    ) {
      return this.selectmenu
    }
    return new SelectMenu(id).set('dropDownArrowSrc', '/imgs/drop-down-arrow.png').set('height', 45)
  }

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
    const slideNum = this.state.onSlide
    this._dialog.setButton('Cancel', e => {
      e.preventDefault()
      this._dialog.set('show', false)
    })
    this._dialog.setButton(
      this.buttons[slideNum], slideNum === 0
        ? this._onNext.bind(this)
        : this._onPlay.bind(this)
    )
  }

  /**
   * Renders this component.
   * @returns {Dialog}
   */
  render () {
    return this._dialog.render()
  }

  /**
   * Registers this component's required event listeners.
   */
  registerEventListeners () {
    const button = document.querySelector('#play-href')
    const dialog = this._dialog

    button.addEventListener('click', e => {
      e.preventDefault()

      dialog.set('show', true)
      document.querySelector('#name-input').value = ''
      document.querySelector('#name-input').focus()
      this.selectmenu = this._getSelectMenu('#select-server')
      this.selectmenu.render()
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
   * Sets the Play dialog's content.
   */
  async setPlayDialogContent () {
    const dialog = this._dialog

    if (!(dialog instanceof Dialog)) {
      /**
       * CONSIDER: Throwing an error if the dialog is not a Dialog object.
       * (30/12/2020) Take-Some-Bytes */
      // No-op if the "Play" dialog is not an instance of the Dialog class.
      return
    }

    // Create the static elements
    dialog.setContent([
      '<form id="dialog-form-1">',
      '<div id="name-input-container">',
      '<label for="name-input">Player Name</label><br>',
      '<input id="name-input" placeholder="Player Name" type="text" autocomplete="off">',
      '</div><div id="server-select-menu-container">',
      '<label for="select-server">Pick a server</label><br>',
      '<select id="select-server"></select>',
      '</div></form>',
      '<span id="error-span"></span>'
    ].join(''))

    try {
      const servers = await this.fetcher.fetchAvailableServers()
      const serverStatuses = await this.fetcher.fetchServersStatus(servers)
      const dialogContent = dialog.contentContainer
      const selectMenu = dialogContent.querySelector('#select-server')
      const serversAvailable = servers.serversAvailable.map(stats => {
        const serverStatus = serverStatuses[stats.serverName].status

        if (
          !serverStatus.serverRunning ||
          serverStatus.full ||
          serverStatus.maxClients === serverStatus.currentClients
        ) {
          return {
            available: false
          }
        }

        return {
          serverName: stats.serverName,
          location: stats.location,
          available: true
        }
      }).filter(stats => !!stats.available)

      serversAvailable.forEach((stats, i) => {
        const option = document.createElement('option')
        option.selected = i === 0
        option.value = JSON.stringify({
          serverLocation: stats.location,
          serverName: stats.serverName
        })
        option.appendChild(document.createTextNode(stats.serverName))
        selectMenu.appendChild(option)
      })
    } catch (ex) {
      console.error(ex.stack)
    }
  }

  /**
   * Initializes this component.
   */
  async init () {
    this.initDialog()
    this.setDialogButtons()
    this.registerEventListeners()
    await this.setPlayDialogContent()
  }
}
