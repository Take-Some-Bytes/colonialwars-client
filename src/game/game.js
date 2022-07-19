/* eslint-env browser */
/**
 * @fileoverview Colonial Wars game client.
 */

import debugFactory from 'debug'

import constants from '../constants.js'
// import Drawing from './drawing/drawing.js'
import World from 'colonialwars-lib/ecs'
import Viewport from './viewport.js'
import InputManager from './input/input-manager.js'
import InputTracker from './input/input-tracker.js'

import PlayerComponent from './components/player'
import * as PhysicsComponents from './components/physics'
import * as PlayerSystems from './systems/player.js'
import Renderer from './render/renderer.js'
import GraphicsStore from './render/graphics-store.js'
import { ImageLoader } from '../helpers/image-helpers.js'
// import Player from './player.js'
// import Vector2D from './physics/vector2d.js'

const { COMMUNICATIONS: communications } = constants
const debug = debugFactory('cw-client:client-game')

const SELF_ID = '@self'
const COMPONENT_MAP = {
  physicalProps: PhysicsComponents.PhysicalProps,
  transform2d: PhysicsComponents.Transform2d,
  velocity2d: PhysicsComponents.Velocity2d,
  player: PlayerComponent
}

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
 * @prop {string} name
 * @prop {string} team
 *
 * @typedef {Object} GameState
 * @prop {PlayerStats} self
 *
 * @typedef {Object} GameOpts
 * @prop {CanvasRenderingContext2D} context
 * @prop {import('../cwdtp/conn').default} conn
 * @prop {import('../apps/play-app').MapData} mapData
 * @prop {import('../helpers/display-utils').ViewportDimensions} vwDimensions
 */

/**
 * Game class.
 */
export default class Game {
  /**
   * Constructor for a Game class. The Game class manages the Colonial Wars
   * game client's communcations, prediction, and rendering.
   * @param {GameOpts} opts Required options.
   */
  constructor (opts) {
    this._conn = opts.conn
    this._mapData = opts.mapData

    this._imgLoader = new ImageLoader({
      baseURL: `${window.location.origin}${constants.IMG_CONSTANTS.GAME_IMAGE_DIR}/`
    })
    this._viewport = new Viewport(opts.context.canvas)
    this._graphicsStore = new GraphicsStore({
      graphicsData: opts.mapData.graphicsData,
      imgLoader: this._imgLoader
    })
    this._inputManager = new InputManager({
      tracker: InputTracker.create(document, opts.context.canvas)
    })
    this._renderer = new Renderer({
      context: opts.context,
      mapData: opts.mapData,
      viewport: this._viewport,
      vwDimensions: opts.vwDimensions,
      graphicsStore: this._graphicsStore
    })

    /**
     * The ID of the player entity in our ECS world.
     * @type {number|null}
     */
    this._self = null
    this._animationFrameID = null
    this._initialized = false

    /**
     * The ECS world where all the entities of the game are going to live.
     * @private
     */
    this._world = new World()
    this._worldInitialized = false

    /**
     * An array of pending messages from the server.
     * @type {Array<GameState>}
     */
    this._inboundMsgs = []
    /**
     * An array of messages that still need to be sent to the server.
     * @type {Array<any>}
     */
    this._outboundMsgs = []

    this._inputNum = 0
    this._lastUpdateTime = 0
  }

  // ================ Private event handling ================ //

  /**
   * Handles client input.
   * @param {import('./input/input-manager').InputState} state
   * The current input state
   * @private
   */
  _onInput (state) {
    if (!this._self) {
      return
    }

    this._inputNum++
    const packagedInput = {
      inputNum: this._inputNum,
      timestamp: Date.now(),
      direction: {
        up: state.keys.up,
        down: state.keys.down,
        left: state.keys.left,
        right: state.keys.right
      }
    }

    const queue = this._world.getComponent('player', { from: this._self }).inputQueue
    queue.push(packagedInput)
    this._outboundMsgs.push(packagedInput)
  }

  /**
   * Handles a new authoritarian game state.
   * @param {string} state The authoritarian state of the game.
   * @private
   */
  _onGameState (state) {
    this._inboundMsgs.push(state)
  }

  // ================ Private update ================ //

  /**
   * Process all messages received from the server.
   * @private
   */
  _processServerMessages () {
    const msgs = this._inboundMsgs.splice(0)

    for (const state of msgs) {
      if (!this._self) {
        this._self = PlayerSystems.createSelf(this._world, {
          id: SELF_ID,
          name: state.self.name,
          team: state.self.team,
          /**
           * TODO: Add a config option to change player mass.
           * (07/15/2022) Take-Some-Bytes */
          mass: 2,
          speed: state.self.speed,
          position: state.self.position
        })
      }

      PlayerSystems.acceptAuthoritativeState(state, {
        world: this._world,
        playerId: this._self,
        worldLimits: this._mapData.worldLimits
      })
    }
  }

  /**
   * Process all client inputs, and arranges for them to be sent to the server
   * at the end of this iteration of the update loop.
   * @param {number} currentTime The current time.
   * @private
   */
  _processInputs (currentTime) {
    if (!this._self) {
      return
    }

    const queue = this._world.getComponent('player', { from: this._self }).inputQueue

    PlayerSystems.processInputs(queue.splice(0), {
      currentTime,
      world: this._world,
      playerId: this._self,
      worldLimits: this._mapData.worldLimits
    })

    const transform = this._world.getComponent('transform2d', { from: this._self })
    this._viewport.updateTrackingPosition(transform.position)
    this._viewport.update(currentTime - this._lastUpdateTime)
  }

  /**
   * Render all the entities onto the screen.
   * @private
   */
  _render () {
    if (!this._self) {
      return
    }

    const transform = this._world.getComponent('transform2d', { from: this._self })

    this._renderer.clear()
    this._renderer.renderMap(transform.position)
  }

  /**
   * Work that needs to be done after everything has been updated.
   * @param {number} currentTime The current time.
   * @private
   */
  _postUpdate (currentTime) {
    this._lastUpdateTime = currentTime

    const outbound = this._outboundMsgs.splice(0)

    for (const msg of outbound) {
      this._conn.emit(communications.CONN_CLIENT_ACTION, msg)
    }
  }

  // ================ Private initialization ================ //

  /**
   * Initializes the ECS world.
   * @private
   */
  _initWorld () {
    if (this._worldInitialized) {
      return
    }

    Object.entries(COMPONENT_MAP).forEach(([name, comp]) => {
      this._world.registerComponent(name, comp)
    })

    this._worldInitialized = true
  }

  /**
   * Initializes the input manager and input bindings.
   * @private
   */
  _initInput () {
    // These are hardcoded right now because I don't want to try to load
    // keybindings right now.
    this._inputManager.bind('w', 'up')
    this._inputManager.bind('s', 'down')
    this._inputManager.bind('a', 'left')
    this._inputManager.bind('d', 'right')
  }

  /**
   * Initializes the Renderer.
   * @private
   */
  async _initRenderer () {
    const worldLimits = this._mapData.worldLimits
    // ~16000 pixels is the maximum canvas size in a browser.
    // We're trying to draw everything onto a canvas and then split it, so
    // we'll have to work around that limit.
    const tooBig = worldLimits.x > 15000 || worldLimits.y > 15000
    const halvedWorldLimits = {
      x: worldLimits.x / 2,
      y: worldLimits.y / 2
    }

    await this._renderer.init({
      // The renderer chunks the map into "big tiles" for performance reasons;
      // this function is just meant to tell the renderer what's in those "big tiles".
      renderMap: async (ctx, opts) => {
        ctx.canvas.width = tooBig
          ? halvedWorldLimits.x
          : worldLimits.x
        ctx.canvas.height = tooBig
          ? halvedWorldLimits.y
          : worldLimits.y

        const start = { x: 0, y: 0 }
        const end = tooBig ? halvedWorldLimits : worldLimits

        const tileSheet = await this._imgLoader.loadImg('tiles.png')
        const frameSize = 100
        const availableFrames = {
          grass: [0, 0],
          sand: [1, 0]
        }
        const frame = availableFrames[this._mapData.tileType]
        const tile = await createImageBitmap(
          tileSheet,
          // Src-X + Src-Y
          frame[0] * frameSize, frame[1] * frameSize,
          // Src width+height.
          frameSize, frameSize
        )

        debug(end)

        for (
          let x = start.x, endX = end.x; x < endX;
          x += constants.GAME_CONSTANTS.DRAWING_TILE_SIZE
        ) {
          for (
            let y = start.y, endY = end.y; y < endY;
            y += constants.GAME_CONSTANTS.DRAWING_TILE_SIZE
          ) {
            ctx.drawImage(tile, x, y)
          }
        }
      }
    })
  }

  // ================ Public initialization ================ //

  /**
   * Initializes this Game client.
   */
  async init () {
    this._initWorld()
    this._initInput()
    this._world.clear()

    await this._initRenderer()

    this._inputManager.on('input', this._onInput.bind(this))
    this._conn.on(communications.CONN_UPDATE, this._onGameState.bind(this))

    this._initialized = true

    debug('Game client initialized.')
  }

  // ================ Public update ================ //

  /**
   * Handles the orchestration of a single animation loop iteration.
   *
   * This method listens to the server, performs client-side prediction, renders
   * entities, and send inputs.
   *
   * @param {number} currentTime The current time.
   */
  update (currentTime) {
    this._processServerMessages()
    this._processInputs(currentTime)
    this._render()
    this._postUpdate(currentTime)
  }

  /**
   * Starts the game render and update loop.
   */
  start () {
    if (!this._initialized) {
      throw new Error('Game is not initialized!')
    }

    const _update = () => {
      this.update(Date.now())

      this._animationFrameID = window.requestAnimationFrame(_update.bind(this))
    }

    _update()
  }

  /**
   * Stops the game render and update loop.
   */
  stop () {
    window.cancelAnimationFrame(this._animationFrameID)
  }

  // ================ Factory method ================ //

  /**
   * Factory method for creating and initializing a Game class.
   * @param {GameOpts} opts Required options.
   * @returns {Promise<Game>}
   */
  static async create (opts) {
    const game = new Game(opts)

    await game.init()

    return game
  }
}
