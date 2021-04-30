/* eslint-env browser */
/**
 * @fileoverview Player class to handle client-side player logic.
 */

import debugFactory from '../debug.js'
import Vector2D from './physics/vector2d.js'
import BoundEntity from './physics/bound-entity.js'

const debug = debugFactory('colonialwars:player')

/**
 * @typedef {Object} PlayerOptions
 * @prop {number} speed
 * @prop {import('./physics/vector2d').default} position
 * @prop {Readonly<import('./physics/bound-entity').Bounds>} worldBounds
 *
 * @typedef {Object} PlayerInput
 * @prop {number} timestamp
 * @prop {number} inputNum
 * @prop {import('./input/input-manager').DirectionState} direction
 */

/**
 * Player class.
 * @extends BoundEntity
 */
export default class Player extends BoundEntity {
  /**
   * Constructor for a Player class. This handles client-side prediction only,
   * and has no effect on the actual authoritarian state of the game.
   * @param {PlayerOptions} options Options.
   */
  constructor (options) {
    const {
      speed, position, worldBounds
    } = options

    super(position, worldBounds)

    this.speed = speed
    this.velocity = Vector2D.zero()
    this.lastInputProcessTime = 0
    /**
     * The last time this client-side player class was updated.
     */
    this.lastUpdateTime = 0
    /**
     * Array of player inputs that have not been processed by the server.
     * @type {Array<PlayerInput>}
     */
    this.unprocessedInputs = []
    /**
     * The input sequence number.
     */
    this.inputNum = 0
    /**
     * The next input to be processed by client-side prediction.
     * @type {PlayerInput}
     */
    this.pendingInput = null
  }

  /**
   * Gets the velocity of this player with the given input.
   * @param {import('./input/input-manager').InputState} data The input data.
   * @returns {Vector2D}
   * @private
   */
  _getVelocity (data) {
    const directionData = data.basic.directionData
    const velocity = Vector2D.zero()

    if (directionData.up) {
      velocity.add({ x: 0, y: -this.speed })
    } else if (directionData.down) {
      velocity.add({ x: 0, y: this.speed })
    }

    if (directionData.left) {
      velocity.add({ x: -this.speed, y: 0 })
    } else if (directionData.right) {
      velocity.add({ x: this.speed, y: 0 })
    }

    return velocity
  }

  /**
   * Performs a physics update for this Player object. Not to be called
   * by the end user.
   * @param {number} deltaTime The time since the last update.
   * @private
   */
  _update (deltaTime) {
    this.position.add(Vector2D.floorAxes(Vector2D.scale(this.velocity, deltaTime)))
    this.boundToBounds()
  }

  /**
   * Accepts the authoritarian state of this player. Server reconciliation is
   * done as a part of this method.
   * @param {import('./game').PlayerStats} state The authoritarian state of this player.
   */
  acceptAuthoritarianState (state) {
    // First, we gotta accept the authoritarian state.
    this.position = Vector2D.fromObject(state.position)
    this.velocity = Vector2D.fromObject(state.velocity)

    // Next, it's server reconciliation.
    const unprocessedInputs = this.unprocessedInputs.splice(0)
    let i = 0
    while (i < unprocessedInputs.length) {
      const pending = unprocessedInputs[i]
      if (pending.inputNum <= state.lastProcessedInput) {
        // Already processed. Its effect is already taken into account into the world update
        // we just got, so we can drop it.
        unprocessedInputs.splice(i, 1)
        this.lastInputProcessTime = pending.timestamp
      } else {
        // Not processed by the server yet. Re-apply it.
        this.updateVelocity({
          basic: {
            directionData: pending.direction
          }
        })
        /**
         * TODO: Test if the below code works as expected.
         * Current, the below uses ``this.lastInputProcessTime``, which is set
         * to the timestamp of the last processed input. Whether it works is not
         * known, due to the fact that Chromium doesn't apply throttling to WebSockets.
         * (04/27/2021) Take-Some-Bytes */
        const deltaTime = pending.timestamp - this.lastInputProcessTime
        this.lastInputProcessTime = pending.timestamp

        this._update(deltaTime)
        i++
      }
    }
  }

  /**
   * Adds a client input to this Player's pending input queue.
   * @param {PlayerInput} input The input to add to this player's pending input queue.
   */
  addInputToQueue (input) {
    this.unprocessedInputs.push(input)
  }

  /**
   * Initializes this Player object.
   */
  init () {
    this.lastInputProcessTime = Date.now()
    this.lastUpdateTime = Date.now()
  }

  /**
   * Updates the state of this player. If there was input, returns it, along with the
   * calculated delta time.
   */
  update () {
    if (this.pendingInput) {
      // Update state based on input timestamp.
      const currentTime = Date.now()
      const deltaTime = currentTime - this.pendingInput.timestamp
      this.lastUpdateTime = this.pendingInput.timestamp
      this.pendingInput = null

      this._update(deltaTime)
      return
    }

    // Otherwise, update the state normally.
    const currentTime = Date.now()
    const deltaTime = currentTime - this.lastUpdateTime
    this.lastUpdateTime = currentTime

    this._update(deltaTime)
  }

  /**
   * Updates this player's velocity on input.
   * @param {import('./input/input-manager').InputState} input The current input state.
   */
  updateVelocity (input) {
    this.velocity = this._getVelocity(input)
  }

  /**
   * Factory method for a Player class.
   * @param {Vector2D} position The starting position of this player.
   * @param {number} speed The speed of this player.
   * @param {Readonly<import('./physics/bound-entity').Bounds>} worldBounds The
   * world bounds for this player.
   * @returns {Player}
   */
  static create (position, speed, worldBounds) {
    const player = new Player({
      position,
      speed,
      worldBounds
    })
    player.init()
    return player
  }
}
