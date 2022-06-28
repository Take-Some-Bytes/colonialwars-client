/* eslint-env browser */
/**
 * @fileoverview PlayDialog component to manage the ``Play`` dialog rendering
 * and state.
 */

import debugFactory from 'debug'

import constants from '../constants.js'
import Dialog from '../ui/dialog.js'
import Selectmenu from '../ui/selectmenu.js'

import { centerPos, ErrorDisplayer } from '../helpers/display-utils.js'
import RadioButtonList from '../ui/radio-button-list.js'
import { removeAllChildNodes } from '../helpers/dom-helpers.js'

import * as loaders from '../helpers/loaders.js'
import * as PlayService from '../services/play-service.js'

const debug = debugFactory('cw-client:play-dialog')
const PlayDialogStates = constants.PLAY_DIALOG_STATES

const loadingTxt = (() => {
  const loadingTxt = document.createElement('b')
  loadingTxt.appendChild(document.createTextNode('Loading...'))
  return loadingTxt
})()
const selectServerForm = (() => {
  const selectServerForm = document.getElementById('play-dialog-form__select-server')
  if (selectServerForm.parentNode) {
    selectServerForm.parentNode.removeChild(selectServerForm)
  }

  return selectServerForm
})()
const selectGameForm = (() => {
  const selectGameForm = document.getElementById('play-dialog-form__select-game')
  if (selectGameForm.parentNode) {
    selectGameForm.parentNode.removeChild(selectGameForm)
  }

  return selectGameForm
})()

/**
 * @typedef {import('../helpers/loaders').CWServerStatus} CWServerStatus
 * @typedef {import('../helpers/loaders').GameInfo} GameInfo
 * @typedef {import('../apps/lobby-app').PlayOpts} PlayOpts
 * @typedef {import('../helpers/loaders').Team} Team
 *
 * @typedef {Object} RadioButtonListChangeData
 * @prop {HTMLInputElement} inputSelected
 * @prop {HTMLLabelElement} labelElem
 * @prop {string} inputValue
 *
 * @typedef {Object} PlayDialogProps
 * @prop {(err: Error) => void} fatalError
 * @prop {() => Array<CWServerStatus>} getServers
 * @prop {(opts: PlayOpts) => void} play
 * @prop {import('../helpers/image-helpers').ImageLoader} imgLoader
 * @prop {import('../helpers/display-utils').ViewportDimensions} vwDimensions
 */

const PLAY_DIALOG_DIMENSIONS = Object.freeze({
  width: constants.ROOT_FONT_SIZE * 30,
  height: constants.ROOT_FONT_SIZE * 36
})
const PLAY_DIALOG_MIN_DIMENSIONS = Object.freeze({
  width: constants.ROOT_FONT_SIZE * 25,
  height: constants.ROOT_FONT_SIZE * 26
})
const SELECTMENU_DIMENSIONS = Object.freeze({
  width: constants.ROOT_FONT_SIZE * 12.5,
  height: constants.ROOT_FONT_SIZE * 2.25
})
const RADIOLIST_DIMENSIONS = SELECTMENU_DIMENSIONS

/**
 * PlayDialog class/component.
 */
export default class PlayDialog {
  /**
   * Create a new PlayDialog object.
   *
   * A PlayDialog object manages the rendering and state of the play dialog.
   * @param {PlayDialogProps} opts Options.
   */
  constructor (opts) {
    const {
      vwDimensions, fatalError, getServers, imgLoader, play
    } = opts
    this.vwDimensions = vwDimensions
    this.fatalError = fatalError
    this.getServers = getServers
    this.imgLoader = imgLoader
    this.play = play

    this.dialog = new Dialog('play')
    this.state = PlayDialogStates.SERVER_PICKER
    this.errorDisplayer = new ErrorDisplayer({
      elem: null,
      classes: ['error']
    })
    /**
     * List of games running on the selected server.
     * @type {Array<GameInfo>}
     */
    this.games = []
    /**
     * List of teams available for the current game.
     * @type {Array<Team>}
     */
    this.teams = []

    /** @type {import('../apps/lobby-app').PlayOpts} */
    this.playOpts = {
      auth: null,
      gameID: null,
      serverLoc: null,
      playerName: null,
      playerTeam: null
    }
    /** @type {Selectmenu} */
    this.serverSelect = null
    /** @type {Selectmenu} */
    this.teamSelect = null
  }

  /**
   * @private
   */
  _onNext () {
    debug('Next clicked')

    // Make sure error displayer displays errors in the correct element, and
    // make sure the element doesn't have any old errors still in it.
    this.errorDisplayer.setElem(document.querySelector(
      '#select-server__error-span'
    ))
    this.errorDisplayer.undisplay()

    // Validate input.
    const data = {
      name: document.querySelector('#name-input').value,
      server: this.serverSelect?.selected
    }
    debug('Player name: %s; Server URL: %s', data.name, data.server)

    const result = PlayService.validateServerPickerData(data)
    if (result.error) {
      debug('Input failed validation. Error is: %O', result.error)
      this.errorDisplayer.display(result.error)
      return
    }
    debug('Input passed validation.')

    // Set dialog content to ``Loading``.
    this.dialog.setContent(loadingTxt.cloneNode(true), false)
    this.dialog.update(this.vwDimensions)

    ;(async () => {
      // Try fetching the games list first, and THEN modify the play dialog state.
      try {
        this.games.push(...await loaders.loadGamesListFrom(data.server))
      } catch (ex) {
        console.error(ex.stack)
        this.fatalError(new Error([
          'Failed to fetch games list from chosen server.',
          'This should not be happening. Please report this to developers.'
        ].join('')))
        return
      }

      this.state = PlayDialogStates.GAME_PICKER
      this.playOpts.playerName = data.name
      this.playOpts.serverLoc = data.server
      this.show()
    })()
  }

  /**
   * @private
   */
  _onPlay () {
    debug('Play clicked')

    this.errorDisplayer.setElem(document.getElementById('select-game__error-span'))
    this.errorDisplayer.undisplay()

    // Validate input.
    // We use the optional chaining operator to avoid blowing up if something
    // isn't defined.
    const data = {
      game: this.gamesList?.selected,
      team: this.teamSelect?.selected
    }
    debug('Game data: %O; Team selected: %s', JSON.parse(data.game), data.team)

    const result = PlayService.validateGamePickerData(data, this.teams.map(t => t.name))
    if (result.error) {
      debug('Input failed validation. Error is: %O', result.error)
      if (!data.game) {
        this.errorDisplayer.display(new Error('No game selected'))
        return
      }
      this.errorDisplayer.display(result.error)
      return
    }
    debug('Input passed validation')

    /** @type {GameInfo} */
    const gameInfo = JSON.parse(data.game)
    this.playOpts.gameID = gameInfo.id
    this.playOpts.playerTeam = data.team

    ;(async () => {
      try {
        this.playOpts.auth = await PlayService.getGameAuth(this.playOpts.serverLoc, this.playOpts)
      } catch (ex) {
        this.errorDisplayer.display(ex)
        return
      }

      this.play(this.playOpts)
    })()
  }

  /**
   * Called when the user closes the Play dialog.
   * @private
   */
  _onClose () {
    debug('Closing dialog')
    // Reset state.
    this.reset()
    this.hide()
  }

  /**
   * Called whenever the selected game in the play dialog changes.
   * @param {RadioButtonListChangeData} data The emitted data.
   * @private
   */
  _onSelectedGameChange (data) {
    const gameInfoContainer = document.querySelector('#game-info')
    // There is only one header element in the game info container.
    const gameInfoHeader = gameInfoContainer.querySelector('header')
    const gameInfoSidebar = gameInfoContainer.querySelector('#game-info-sidebar')
    const previewContainer = document.querySelector('#map-preview')
    /** @type {GameInfo} */
    const gameInfo = JSON.parse(data.inputValue)

    // Undisplay any displayed error.
    this.errorDisplayer.undisplay()

    // Start loading preview.
    removeAllChildNodes(previewContainer)
    this.imgLoader.loadImg(`${gameInfo.name.toLowerCase()}-preview.png`)
      .then(img => {
        img.width = 200
        img.height = 200
        previewContainer.appendChild(img)
      })

    // Display game name.
    removeAllChildNodes(gameInfoHeader)
    gameInfoHeader.appendChild(document.createTextNode(
      `${gameInfo.name} ${gameInfo.id}: ${gameInfo.mode}`
    ))

    // Display game details.
    const capacityDetails = document.createElement('p')
    const description = document.createElement('p')
    capacityDetails.appendChild(document.createTextNode(
      `Players: ${gameInfo.capacity.current}/${gameInfo.capacity.max}`
    ))
    description.appendChild(document.createTextNode(gameInfo.description))

    removeAllChildNodes(gameInfoSidebar)
    gameInfoSidebar.appendChild(capacityDetails)
    gameInfoSidebar.appendChild(description)

    // Display team picker.
    this.teamSelect = this._createTeamSelect(
      gameInfoContainer.querySelector('#team-selectmenu'), gameInfo.teams
    )
    this.teams = gameInfo.teams

    gameInfoContainer.style.display = 'block'
  }

  /**
   * Clears the game info panel.
   * @param {Element} parent The parent element of the game info panel.
   * @private
   */
  _clearGameInfoPanel (parent) {
    const container = parent.querySelector('#game-info')
    const header = container.querySelector('#game-info__header')
    const mapPreview = container.querySelector('#map-preview')
    const sidebar = container.querySelector('#game-info-sidebar')
    const teamSelect = container.querySelector('#team-selectmenu')

    removeAllChildNodes(header)
    removeAllChildNodes(mapPreview)
    removeAllChildNodes(sidebar)
    removeAllChildNodes(teamSelect)

    container.style.display = 'none'
  }

  /**
   * Creates and returns the server selection menu.
   * @param {HTMLSelectElement} selectElem The ``<select>`` element to create the
   * Selectmenu with.
   * @param {Array<CWServerStatus>} servers A list of servers that are available.
   * @returns {Selectmenu}
   * @private
   */
  _createServerSelect (selectElem, servers) {
    const select = new Selectmenu(selectElem)
      .set('dropDownArrowSrc', '/imgs/drop-down-arrow.png')
      .set('height', SELECTMENU_DIMENSIONS.height)
      .set('width', SELECTMENU_DIMENSIONS.width)
      .set('show', true)

    for (const [i, server] of servers.entries()) {
      select.options.set(`server-${i}`, {
        value: server.location,
        content: server.name,
        selected: i === 0,
        disabled: !server.available
      })
    }

    select.update()

    return select
  }

  /**
   * Creates and returns the game selection list.
   * @param {HTMLElement} parentElem An element to attach the radio list to.
   * @param {Array<GameInfo>} games A list of games that are running.
   * @returns {RadioButtonList}
   * @private
   */
  _createGamesList (parentElem, games) {
    const radioList = new RadioButtonList('game-select')
      .set('itemHeight', RADIOLIST_DIMENSIONS.height)
      .set('itemWidth', RADIOLIST_DIMENSIONS.width)
      .set('show', true)

    for (const [i, game] of games.entries()) {
      radioList.setRadioButton(`game-${i}`, {
        checked: false,
        value: JSON.stringify(game),
        labelContent: game.name,
        disabled: game.capacity.current === game.capacity.max
      })
    }

    radioList
      .update()
      .attach(parentElem)

    return radioList
  }

  /**
   * Creates the teams selection menu.
   * @param {HTMLSelectElement} selectElem The select element to use.
   * @param {Array<Team>} teams An array of teams that are available.
   * @returns {Selectmenu}
   * @private
   */
  _createTeamSelect (selectElem, teams) {
    const select = new Selectmenu(selectElem)
      .set('dropDownArrowSrc', '/imgs/drop-down-arrow.png')
      .set('height', SELECTMENU_DIMENSIONS.height)
      .set('width', SELECTMENU_DIMENSIONS.width)
      .set('show', true)

    let selectedSet = false
    for (const [i, team] of teams.entries()) {
      const opts = {
        value: team.name,
        content: team.name,
        selected: false,
        disabled: team.full
      }
      if (!team.full && !selectedSet) {
        selectedSet = true
        opts.selected = true
      }

      select.options.set(`team-${i}`, opts)
    }

    select.update()

    return select
  }

  /**
   * Set the Play dialog's buttons, depending on the current state.
   * @private
   */
  _setButtons () {
    // Clear the buttons
    this.dialog.buttons.clear()

    if (this.state === PlayDialogStates.SERVER_PICKER) {
      // Server picker, so we'll need to add a "Next" button.
      this.dialog.buttons.set('Next', this._onNext)
    } else {
      // Game picker, so we'll need to add a "Play" button
      this.dialog.buttons.set('Play', this._onPlay)
    }

    // We always need a Cancel button.
    this.dialog.buttons.set('Cancel', this._onClose)
  }

  /**
   * Set the content of this PlayDialog.
   * @private
   */
  _setContent () {
    /** @type {HTMLFormElement} */
    const content = this.state === PlayDialogStates.SERVER_PICKER
      ? selectServerForm
      : selectGameForm
    content.classList.remove('hidden')

    if (this.state === PlayDialogStates.SERVER_PICKER) {
      // It's the server picker!
      // Create the actual server select menu.
      this.serverSelect = this._createServerSelect(
        content.querySelector('#server-selectmenu'), this.getServers()
      )
    } else {
      // It's the game picker!
      // Create the game select list.
      this.gamesList = this._createGamesList(
        content.querySelector('#games-list'), this.games
      )
      this.gamesList.on('change', this._onSelectedGameChange)
    }

    this.dialog.setContent(content, false)
  }

  /**
   * Clears the content put inside the select server and select game forms.
   * @private
   */
  _clearContent () {
    // Clear options in the server selectmenu.
    removeAllChildNodes(selectServerForm.querySelector('#server-selectmenu'))
    // Remove the games radio button list.
    removeAllChildNodes(selectGameForm.querySelector('#games-list'))

    this._clearGameInfoPanel(selectGameForm)
  }

  /**
   * Initialize this PlayDialog.
   */
  init () {
    const dialogPosition = centerPos(PLAY_DIALOG_DIMENSIONS, this.vwDimensions)

    this.dialog
      .set('title', 'Play')
      .set('isModal', true)
      .set('draggable', true)
      .set('x', dialogPosition.x)
      .set('y', dialogPosition.y)
      .set('width', PLAY_DIALOG_DIMENSIONS.width)
      .set('height', PLAY_DIALOG_DIMENSIONS.height)
      .set('min-width', PLAY_DIALOG_MIN_DIMENSIONS.width)
      .set('min-height', PLAY_DIALOG_MIN_DIMENSIONS.height)
      .attach(document.getElementById('root'))
      .update(this.vwDimensions)

    // Bind event listeners.
    this._onNext = this._onNext.bind(this)
    this._onPlay = this._onPlay.bind(this)
    this._onClose = this._onClose.bind(this)
    this._onSelectedGameChange = this._onSelectedGameChange.bind(this)

    // Hide the dialog on close button click.
    this.dialog.on('closeButtonClick', this._onClose)

    // Just in case.
    this.dialog.setContent(document.createTextNode('Loading...'), false)
  }

  /**
   * Show this Play dialog.
   */
  show () {
    this._setButtons()
    this._setContent()
    this.dialog.set('show', true)
    this.dialog.update(this.vwDimensions)
  }

  /**
   * Hide this Play dialog.
   */
  hide () {
    this.gamesList = null
    this.serverSelect = null
    this.games.splice(0)
    this._clearContent()
    this.dialog.set('show', false)
    this.dialog.update(this.vwDimensions)
  }

  /**
   * Resets this Play dialog's state.
   */
  reset () {
    this.state = PlayDialogStates.SERVER_PICKER
    this.playOpts = Object.fromEntries(
      Object.entries(this.playOpts).map(([key]) => [key, null])
    )
  }
}
