/* eslint-env browser */
/**
 * @fileoverview PlayDialog component to manage the ``Play`` dialog rendering
 * and state.
 */

import Dialog from '../ui/dialog.js'
import SelectMenu from '../ui/selectmenu.js'
import RadioButtonList from '../ui/radio-button-list.js'
import constants from '../constants.js'

import * as validator from '../validation/validator.js'
import * as domHelpers from '../helpers/dom-helpers.js'

import { playInputSchemas } from '../validation/schemas.js'
import { ErrorDisplayer } from '../helpers/display-utils.js'

/**
 * @typedef {Object} PlayDialogConfig
 * @prop {Record<string, any>} dialogConf
 * @prop {Record<string, string} previewsPaths
 * @prop {import('../helpers/fetcher').default} fetcher
 * @prop {import('../apps/lobby-app').PlayerReadyHandler} onPlayerReady
 * @prop {import('../helpers/display-utils').ViewportDimensions} viewportDimensions
 *
 * @typedef {Record<'playerName'|'playerTeam'|'playerGame', string>} GameAuthOptions
 * @typedef {'server'|'gameID'|'playerName'|'playerTeam'} PlayDataKeys
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
      fetcher, dialogConf, previewsPaths,
      onPlayerReady, viewportDimensions
    } = config

    this.viewportDimensions = viewportDimensions
    this.previewsPaths = previewsPaths
    this.onPlayerReady = onPlayerReady
    this.schemas = playInputSchemas
    this.dialogConf = dialogConf
    this.fetcher = fetcher

    this.buttons = ['Next', 'Play']
    this.state = {
      onSlide: 0,
      /**
       * @type {Record<PlayDataKeys, string>}
       */
      playData: {
        server: null,
        gameID: null,
        playerName: null,
        playerTeam: null
      }
    }
    this.name = 'Play'

    this._dialog = null
    this._teamSelect = null
    this._serverSelect = null
    this._radioButtonList = null
    this._errorDisplayer = new ErrorDisplayer({
      elem: null,
      classes: ['error']
    })
  }

  /**
   * Gets the game authorization for this client.
   * @param {string} serverLoc
   * The location of the server to fetch the game authorization from.
   * @param {GameAuthOptions} opts Options.
   * @returns {Promise<false|string>}
   * Returns the game authorization if fetched successfully, false otherwise.
   * @private
   */
  async _getGameAuth (serverLoc, opts) {
    const {
      playerName: name,
      playerTeam: team,
      playerGame: game
    } = opts
    const uri = encodeURI(
      `${serverLoc}/game-auth/get?playername=${name}&playerteam=${team}&playergame=${game}`
    )
    const res = await this.fetcher.fetchResource(uri)

    if (res.status === 409) {
      console.error('Player already exists!')
      this._errorDisplayer.display(new Error('Player already exists!'), false)
      return false
    }

    if (!res.ok) {
      console.error(await res.json())
      this._errorDisplayer.display(
        new Error('Something went wrong. Please try again later.'),
        false
      )
      return false
    }

    return (await res.json()).data.auth
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
      `${constants.IMG_CONSTANTS.GAME_IMAGE_DIR}/${this.previewsPaths[gameData.name.toLowerCase()]}`

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
    this._teamSelect = new SelectMenu('team-select')
      .set('dropDownArrowSrc', '/imgs/drop-down-arrow.png')
      .set('renderTarget', gameStatsContainer)
      .set('height', 45)
    for (let i = 0, l = gameData.teams.length; i < l; i++) {
      this._teamSelect.setOption(
        `team-opt-${i}`, {
          add: true,
          value: gameData.teams[i],
          content: gameData.teams[i],
          selected: i === 0
        }
      )
    }
    this._teamSelect.render()
  }

  /**
   * Handles when the client clicks the ``Next`` button.
   * @param {Event} e The DOM event that happened.
   * @private
   */
  async _onNext (e) {
    const dialog = this._dialog

    this._errorDisplayer.setElem(document.querySelector('#error-span'))
    this._errorDisplayer.undisplay()
    e.preventDefault()

    const data = {
      playerName: document.querySelector('#name-input').value,
      server: this._serverSelect.selected
    }
    const error = validator.validateObj(this.schemas[0], data)
    if (error instanceof validator.ValidationError) {
      this._errorDisplayer.display(error, true)
      return
    }

    console.log(data)
    console.log(JSON.parse(data.server))
    dialog.setContent('<b>Loading...</b>', false)
    this.state.onSlide = 1
    this.setDialogButtons()
    this.state.playData.playerName = data.playerName
    this.state.playData.server = data.server
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
        '<form id="dialog-form-2">',
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
      this._errorDisplayer.setElem(document.querySelector('#error-span'))
      this._errorDisplayer.display({
        message: 'Something went wrong. Please try again later.'
      }, false)
    }
  }

  /**
   * Handles when the client clicks the ``Play`` button.
   * @param {Event} e The DOM event that happened.
   * @private
   */
  async _onPlay (e) {
    const dialog = this._dialog

    this._errorDisplayer.setElem(document.querySelector('#error-span'))
    this._errorDisplayer.undisplay()
    e.preventDefault()

    const data = {
      game: this._radioButtonList.selected,
      team: this._teamSelect.selected
    }
    const error = validator.validateObj(Object.assign(
      this.schemas[1], {
        team: validator.all(
          validator.string(), validator.isOneOf(JSON.parse(data.game).teams)
        )
      }
    ), data)
    if (error instanceof validator.ValidationError) {
      this._errorDisplayer.display(error, true)
      return
    }
    const game = JSON.parse(data.game)
    this.state.playData = {
      server: this.state.playData.server,
      gameID: game.id,
      playerName: this.state.playData.playerName,
      playerTeam: data.team
    }

    console.log(this._playData)
    console.log(JSON.parse(data.game))
    dialog.setContent('<b>Loading...</b>', false)

    const serverLoc = JSON.parse(this.state.playData.server).serverLocation
    const gameAuth = await this._getGameAuth(serverLoc, {
      playerName: this.state.playData.playerName,
      playerTeam: this.state.playData.playerTeam,
      playerGame: this.state.playData.gameID
    })
    if (!gameAuth) {
      // The error is handled in the ``._getGameAuth method``.
      return
    }

    const promise = this.onPlayerReady({
      playerName: this.state.playData.playerName,
      playerTeam: this.state.playData.playerTeam,
      gameID: this.state.playData.gameID,
      serverLoc: JSON.parse(this.state.playData.server).serverLocation,
      auth: gameAuth
    })
    console.log(this.state.playData.gameID)

    // Await the returned promise if there was one--we don't want the
    // onPlayerReady function to pause and stop executing.
    if (promise instanceof Promise) {
      await promise
    }
  }

  /**
   * Initializes this component's actual dialog.
   */
  initDialog () {
    this._dialog = Dialog.create(this.viewportDimensions, this.name, this.dialogConf)
    this._dialog.onCloseButtonClick(e => {
      e.preventDefault()
      this.state.onSlide = 0
      this._dialog.set('show', false)
    })
    this._dialog
      .set('min-height', 300)
      .set('min-width', 300)
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
   * Hides this component.
   * @returns {Dialog}
   */
  hide () {
    this.state.onSlide = 0
    return this._dialog.hide()
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
      this._serverSelect = selectMenu
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
