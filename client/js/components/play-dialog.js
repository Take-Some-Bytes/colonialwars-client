/* eslint-env browser */
/**
 * @fileoverview PlayDialog component to manage the ``Play`` dialog rendering
 * and state.
 */

import Dialog from '../ui/dialog.js'
import SelectMenu from '../ui/selectmenu.js'
import RadioButtonList from '../ui/radio-button-list.js'

import * as validator from '../validation/validator.js'
import * as domHelpers from '../helpers/dom-helpers.js'

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
    this._selectmenu = null
    this._radioButtonList = null
  }

  /**
   * Displays data about a specified game.
   * @param {RadioButtonList} radioList The radio list of games that the client could select.
   */
  _displayGameData (radioList) {
    const gameStatsContainer = this._dialog.contentContainer.querySelector('#game-stats-container')
    const gameData = JSON.parse(radioList.selected)
    domHelpers.removeAllChildNodes(gameStatsContainer)
    gameStatsContainer.insertAdjacentHTML(
      'afterbegin', [
        `<h4>${gameData.name} ${gameData.id}</h4>`
      ].join('')
    )
  }

  /**
   * Handles when the client clicks the ``Next`` button.
   * @param {Event} e The DOM event that happened.
   * @private
   */
  async _onNext (e) {
    const errorSpan = document.querySelector('#error-span')
    const dialog = this._dialog

    removeAllChildNodes(errorSpan)
    e.preventDefault()

    const data = {
      playerName: document.querySelector('#name-input').value,
      server: this._selectmenu.selected
    }
    const error = validator.validateObj(this.schemas[0], data)
    if (error instanceof validator.ValidationError) {
      errorSpan.classList.add('error')
      errorSpan.appendChild(document.createTextNode(
        `${error.message} To fix this issue, ${error.toFix.toLowerCase()}`
      ))
      return
    }

    console.log(data)
    console.log(JSON.parse(data.server))
    dialog.setContent('<b>Loading...</b>', false)
    this._selectmenu = null
    this.state.onSlide = 1
    this.setDialogButtons()
    try {
      const parsedData = JSON.parse(data.server)
      const games = await this.fetcher.fetchGamesListFrom(parsedData.serverLocation)
      const len = games.length
      const radioList = this._radioButtonList = new RadioButtonList('game-select')

      console.log(games)
      for (let i = 0; i < len; i++) {
        const game = games[i]
        this._radioButtonList.setOption(`game-${game.id}`, {
          labelContent: `${game.name} ${game.id}`,
          checked: i === 0,
          value: JSON.stringify(game)
        })
      }
      dialog.setContent([
        '<form id="dialog-form-1">',
        '<div id="game-list-container">',
        `<label for="${this._radioButtonList.listContainer.id}">Choose a game</label><br>`,
        '</div><hr><div id="game-stats-container"></div></form>',
        '<span id="error-span"></span>'
      ].join(''), false)
      this._displayGameData(radioList)
      radioList.set('renderTarget', dialog.contentContainer.querySelector('#game-list-container'))
      radioList.on('change', () => {
        this._displayGameData(radioList)
      })
    } catch (ex) {
      console.error(ex)
      errorSpan.classList.add('error')
      errorSpan.appendChild(document.createTextNode(
        'Something went wrong. Please try again later.'
      ))
    }
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
    if (this._selectmenu instanceof SelectMenu &&
      `#${this._selectmenu.selectmenu.id}` === id
    ) {
      return this._selectmenu
    }
    return new SelectMenu(id).set('dropDownArrowSrc', '/imgs/drop-down-arrow.png').set('height', 45)
  }

  /**
   * Initializes this component's actual dialog.
   */
  initDialog () {
    this._dialog = Dialog.create(this.constants, this.name, this.dialogConf)
    this._dialog.onCloseButtonClick(e => {
      e.preventDefault()
      this.state.onSlide = 0
      this._dialog.set('show', false)
    })
    this._dialog.set(
      'min-height', 300
    ).set(
      'min-width', 300
    )
  }

  /**
   * Sets this dialog's buttons.
   */
  setDialogButtons () {
    const slideNum = this.state.onSlide
    this._dialog.setButton('Cancel', e => {
      e.preventDefault()
      this.state.onSlide = 0
      this._dialog.set('show', false)
    })
    this._dialog.setButton(
      this.buttons[slideNum], slideNum === 0
        ? this._onNext.bind(this)
        : this._onPlay.bind(this)
    )
    if (slideNum === 0) {
      this._dialog.removeButton('Play')
    } else if (slideNum === 1) {
      this._dialog.removeButton('Next')
      this._dialog.render(true)
    }
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

    button.addEventListener('click', async e => {
      e.preventDefault()
      await this.setPlayDialogContent()

      this.setDialogButtons()
      dialog.set('show', true)
      document.querySelector('#name-input').value = ''
      document.querySelector('#name-input').focus()
      this._selectmenu = this._getSelectMenu('#select-server')
      this._selectmenu.render()
    })
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
    ].join(''), false)

    try {
      const servers = await this.fetcher.fetchAvailableServers()
      const serverStatuses = await this.fetcher.fetchServersStatus(servers)
      const dialogContent = dialog.contentContainer
      const selectMenu = new SelectMenu(
        dialogContent.querySelector('#select-server')
      ).set('dropDownArrowSrc', '/imgs/drop-down-arrow.png').set('height', 45)
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
        selectMenu.setOption(`opt-${i}`, {
          add: true,
          value: JSON.stringify({
            serverLocation: stats.location,
            serverName: stats.serverName
          }),
          content: stats.serverName,
          selected: i === 0
        })
      })
      this._selectmenu = selectMenu
    } catch (ex) {
      console.error(ex.stack)
    }
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
