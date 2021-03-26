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
 * @prop {Record<string, any>} dialogConf
 * @prop {Record<string, string} previewsPaths
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
      dialogConf, fetcher, constants, previewsPaths
    } = config

    this.schemas = playInputSchemas
    this.dialogConf = dialogConf
    this.fetcher = fetcher
    this.constants = constants
    this.previewsPaths = previewsPaths

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
   * @private
   */
  _displayGameData (radioList) {
    const gameStatsContainer = this._dialog.contentContainer.querySelector('#game-stats-container')
    const gameData = JSON.parse(radioList.selected)
    const preview = document.createElement('img')
    domHelpers.removeAllChildNodes(gameStatsContainer)

    preview.id = 'map-preview'
    preview.src =
      `${this.constants.IMG_CONSTANTS.GAME_IMAGE_DIR}/${this.previewsPaths[gameData.name.toLowerCase()]}`

    gameStatsContainer.insertAdjacentHTML(
      'afterbegin',
      [
        '<header><span class="has-margin bold">',
        `${gameData.name} ${gameData.id}: ${gameData.mode}</span></header>`
      ].join('')
    )
    gameStatsContainer.appendChild(preview)
    gameStatsContainer.insertAdjacentHTML(
      'beforeend',
      [
        '<p class="sidebar-float">Players: ',
        `${gameData.capacity.current}/${gameData.capacity.max}</p>`,
        `<p>${gameData.description}</p>`
      ].join('')
    )
    const selectmenu = new SelectMenu('team-select')
      .set('dropDownArrowSrc', '/imgs/drop-down-arrow.png')
      .set('renderTarget', gameStatsContainer)
      .set('height', 45)
    for (let i = 0, l = gameData.teams.length; i < l; i++) {
      selectmenu.setOption(
        `team-opt-${i}`, {
          add: true,
          value: gameData.teams[i],
          content: gameData.teams[i],
          selected: i === 0
        }
      )
    }
    selectmenu.render()
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
    // Set play dialog content to "Loading" so users could at least see SOMETHING
    // while we load the required data.
    this._dialog.setContent('<b>Loading...</b>', false)
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
      if (this._dialog.config.show) {
        this._dialog.render(true)
      }
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
    const button = document.querySelector('#play-button')
    const dialog = this._dialog

    button.addEventListener('click', async e => {
      e.preventDefault()
      dialog.set('show', true)
      await this.setPlayDialogContent()

      this.setDialogButtons()
      document.querySelector('#name-input').value = ''
      document.querySelector('#name-input').focus()
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

    try {
      const servers = await this.fetcher.fetchAvailableServers()
      const serverStatuses = await this.fetcher.fetchServersStatus(servers)

      // Create the static elements
      dialog.setContent([
        '<form id="dialog-form-1">',
        '<div id="name-input-container">',
        '<label for="name-input">Player Name</label><br>',
        '<input id="name-input" placeholder="Player Name" type="text" autocomplete="off">',
        '</div><div id="server-select-menu-container">',
        '<label for="select-server">Pick a server</label><br>',
        '</div></form>',
        '<span id="error-span"></span>'
      ].join(''), false)

      const dialogContent = dialog.contentContainer
      const selectMenu = new SelectMenu('server-select')
        .set('dropDownArrowSrc', '/imgs/drop-down-arrow.png')
        .set('renderTarget', dialogContent.querySelector('#server-select-menu-container'))
        .set('height', 45)
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
