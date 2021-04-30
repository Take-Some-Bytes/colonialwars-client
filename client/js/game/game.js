/* eslint-env browser */
/**
 * @fileoverview Colonial Wars game client.
 */

import debugFactory from '../debug.js'
import constants from '../constants.js'
import Drawing from './drawing/drawing.js'
import Viewport from './viewport.js'
import InputManager from './input/input-manager.js'
import Player from './player.js'
import Vector2D from './physics/vector2d.js'

const { COMMUNICATIONS: communications } = constants
const debug = debugFactory('colonialwars:client-game')

/**
 * @typedef {Object} WorldLimits
 * @prop {number} x
 * @prop {number} y
 *
 * @typedef {Object} PlayerStats
 * @prop {import('./physics/vector2d').default} position
 * @prop {import('./physics/vector2d').default} velocity
 * @prop {number} lastProcessedInput
 * @prop {number} speed
 *
 * @typedef {Object} GameOptions
 * @prop {import('../cwdtp/conn').default} conn The CWDTP connection to use.
 * @prop {import('./input/input-manager').default} inputManager
 * The input manager to use.
 * @prop {Readonly<WorldLimits>} worldLimits
 * @prop {{}} staticMapElems
 * @prop {'grass'|'sand'} mapTheme
 * @prop {import('./viewport').default} viewport
 * @prop {import('./drawing/drawing').default} drawing The Drawing object to use.
 * @prop {import('../helpers/display-utils').ViewportDimensions} viewportDimensions
 *
 * @typedef {Object} GameState
 * @prop {PlayerStats} self
 *
 * @typedef {Object} GameKeyBindings
 * @prop {import('./input/input-manager').DirectionBindings} directionBindings
 */

/**
 * Game class.
 */
export default class Game {
  /**
   * Constructor for a Game class. The Game class manages the Colonial Wars
   * game client.
   * @param {GameOptions} opts Options.
   */
  constructor (opts) {
    const {
      conn, drawing, mapTheme, viewport, worldLimits, inputManager,
      staticMapElems, viewportDimensions
    } = opts

    this.conn = conn
    this.drawing = drawing
    // this.mapTheme = mapTheme
    this.viewport = viewport
    this.worldLimits = worldLimits
    this.inputManager = inputManager
    // this.staticMapElems = staticMapElems
    // this.viewportDimensions = viewportDimensions

    this.self = null
    this.lastUpdateTime = 0
    this.deltaTime = 0
    /**
     * Array of inputs that still have not been processed by us.
     * @type {Array<import('./input/input-manager').InputState>}
     */
    this.unprocessedInputs = []
    this.lastProcessedInput = 0
    this.inputNum = 0
    this.animationFrameID = null

    /**
     * The game state that has yet to be processed by this client.
     * @type {GameState}
     */
    this.stateToProcess = null
    /**
     * This stores the input we'll need to send. It's not a list because that
     * will make client-side prediction a nightmare.
     * @type {import('../game/input/input-manager').InputState}
     */
    this.inputToSend = null
  }

  /**
   * Handles client input.
   * @param {import('../game/input/input-manager').InputState} state
   * The current input state
   * @private
   */
  _onInput (state) {
    if (this.self) {
      this.inputNum++
      const packagedInput = {
        inputNum: this.inputNum,
        timestamp: Date.now(),
        direction: state.basic.directionData
      }
      // // Perform client-side prediction.
      this.self.addInputToQueue(packagedInput)
      this.self.updateVelocity(state)
      this.self.pendingInput = packagedInput
      // // this.self.update(packagedInput.timestamp)
      // const deltaTime = packagedInput.timestamp - this.self.lastInputProcessTime
      // this.self.lastInputProcessTime = packagedInput.timestamp

      // this.self._update(deltaTime)
      // const packagedInput = this.self.update(state)
      // this.self.addInputToQueue(packagedInput)
      this.conn.emit(communications.CONN_CLIENT_ACTION, packagedInput)
      // this.viewport.updateTrackingPosition(this.self.position)
    }
    // this.inputToSend = state
  }

  /**
   * Handles a new authoritarian game state.
   * @param {string} state The authoritarian state of the game.
   * @private
   */
  _onGameState (state) {
    /**
     * @type {GameState}
     */
    const parsed = JSON.parse(state)
    if (!this.self) {
      this.self = Player.create(Vector2D.fromObject(parsed.self.position), parsed.self.speed, {
        x: { MIN: 0, MAX: this.worldLimits.x },
        y: { MIN: 0, MAX: this.worldLimits.y }
      })
    }
    this.self.acceptAuthoritarianState(parsed.self)

    // this.viewport.updateTrackingPosition(this.self.position)
    // debug('Server-sent: %o', this.self.position)
    // this.stateToProcess = JSON.parse(state)
  }

  // /**
  //  * Processes the authoritarian state of the game, as sent by the server.
  //  * @param {GameState} state The authoritarian state of the game.
  //  */
  // processGameState (state) {
  //   if (!this.self) {
  //     this.self = Player.create(Vector2D.fromObject(state.self.position), state.self.speed, {
  //       x: { MIN: 0, MAX: this.worldLimits.x },
  //       y: { MIN: 0, MAX: this.worldLimits.y }
  //     })
  //   }
  //   this.self.acceptAuthoritarianState(state.self)

  //   this.viewport.updateTrackingPosition(this.self.position)
  // }

  // /**
  //  * Processes the current client input.
  //  * @param {import('./input/input-manager').InputState} state The current input state.
  //  */
  // processInput (state) {
  //   if (this.self) {
  //     this.lastEmittedInput++
  //     const packagedInput = {
  //       inputNum: this.lastEmittedInput,
  //       timestamp: Date.now(),
  //       direction: state.basic.directionData
  //     }
  //     this.conn.emit(communications.CONN_CLIENT_ACTION, packagedInput)
  //     // Perform client-side prediction.
  //     this.self.addInputToQueue(packagedInput)
  //     this.self.updateVelocity(packagedInput)
  //     this.self.update()
  //     // this.self.update(packagedInput.timestamp)
  //     debug('Input timestamp: %d; Last input process timestamp: %d', packagedInput.timestamp, this.self.lastInputProcessTime)
  //     // const deltaTime = packagedInput.timestamp - this.self.lastInputProcessTime
  //     // this.self.lastInputProcessTime = packagedInput.timestamp

  //     // debug('Deltatime: %d', deltaTime)
  //     // this.self._update(deltaTime)
  //     this.viewport.updateTrackingPosition(this.self.position)
  //   }
  // }

  // /**
  //  * Performs a client game update.
  //  */
  // update () {
  //   if (this.stateToProcess) {
  //     this.processGameState(this.stateToProcess)
  //     this.stateToProcess = null
  //   }

  //   if (this.inputToSend) {
  //     this.processInput(this.inputToSend)
  //     this.inputToSend = null
  //   }
  // }

  /**
   * Draws the current state of the game onto the game canvas.
   */
  draw () {
    if (this.self) {
      this.drawing.clear()
      this.drawing.drawMap(this.self.position)
    }
  }

  /**
   * Initializes this Game client.
   */
  init () {
    this.inputManager.on('input', this._onInput.bind(this))
    this.conn.on(communications.CONN_UPDATE, this._onGameState.bind(this))

    debug('Game client initialized.')
  }

  /**
   * Starts the game animation loop and update loop.
   */
  run () {
    const currentTime = Date.now()
    this.deltaTime = currentTime - this.lastUpdateTime
    this.lastUpdateTime = currentTime

    // this.update()
    if (this.self) {
      if (this.inputToSend) {
        // this.self.setInputToSend(this.inputToSend)
        // this.inputNum++
        // const state = this.inputToSend
        // this.inputToSend = null
        // const packagedInput = {
        //   inputNum: this.inputNum,
        //   timestamp: Date.now(),
        //   direction: state.basic.directionData
        // }
        // // // Perform client-side prediction.
        // this.self.addInputToQueue(packagedInput)
        // this.self.updateVelocity(state)
        // // // this.self.update(packagedInput.timestamp)
        // // const deltaTime = packagedInput.timestamp - this.self.lastInputProcessTime
        // // this.self.lastInputProcessTime = packagedInput.timestamp

        // // this.self._update(deltaTime)
        // // const packagedInput = this.self.update(state)
        // this.self.addInputToQueue(packagedInput)
        // this.conn.emit(communications.CONN_CLIENT_ACTION, packagedInput)
        // // this.self.update()
        // debug('Client-predicted player position: %o', this.self.position)
      // this.viewport.updateTrackingPosition(this.self.position)
      }

      this.self.update()
      // const inputInfo = this.self.update()
      // if (inputInfo) {
      //   debug(inputInfo.delta)
      //   const packagedInput = {
      //     inputNum: this.inputNum,
      //     timestamp: inputInfo.timestamp,
      //     delta: inputInfo.delta,
      //     direction: inputInfo.input.basic.directionData
      //   }
      //   this.self.addInputToQueue(packagedInput)
      //   this.conn.emit(communications.CONN_CLIENT_ACTION, packagedInput)
      // }

      this.viewport.updateTrackingPosition(this.self.position)
      this.viewport.update(this.deltaTime)
    }

    this.draw()

    this.animationFrameID = window.requestAnimationFrame(this.run.bind(this))
  }

  /**
   * Stops the game animation and update loop.
   */
  stop () {
    window.cancelAnimationFrame(this.animationFrameID)
  }

  /**
   * Factory method for creating a Game class.
   * @param {CanvasRenderingContext2D} ctx The canvas context to work with.
   * @param {import('../cwdtp/conn').default} conn The CWDTP connection to use.
   * @param {import('./drawing/map-drawer').MapConfig} mapConfig
   * @param {GameKeyBindings} keyBindings The client's keybindings.
   * @param {import('../helpers/display-utils').ViewportDimensions} vwDimensions
   * @returns {Promise<Game>}
   */
  static async create (ctx, conn, mapConfig, keyBindings, vwDimensions) {
    const viewport = Viewport.create(ctx.canvas)
    const drawing = await Drawing.create(ctx, mapConfig, viewport, vwDimensions)
    const inputManager = InputManager.create(
      keyBindings.directionBindings, document, ctx.canvas
    )

    const game = new Game({
      conn,
      drawing,
      viewport,
      inputManager,
      worldLimits: mapConfig.worldLimits
    })
    game.init()

    return game
  }
}
