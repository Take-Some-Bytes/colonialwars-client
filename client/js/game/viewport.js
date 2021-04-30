/* eslint-env browser */
/**
 * @fileoverview Viewport class to manage client viewport.
 */

import constants from '../constants.js'
import Vector2D from './physics/vector2d.js'
import BoundEntity from './physics/bound-entity.js'

/**
 * Viewport class.
 * @extends BoundEntity
 */
export default class Viewport extends BoundEntity {
  /**
   * Constructor for a Viewport object. The position of the viewport will hold
   * the absolute world coordinates for the top left of the view (which
   * correspond to canvas coordinates ``[width / 2, height / 2]``).
   * @class
   * @param {Vector2D} position The starting position of the viewport.
   * @param {Vector2D} velocity The starting velocity of the viewport.
   * @param {number} canvasWidth The width of the canvas for this viewport.
   * @param {number} canvasHeight The height of the canvas for this viewport.
   */
  constructor (position, velocity, canvasWidth, canvasHeight) {
    super(position, velocity)

    this.playerPosition = null
    this.canvasOffset = new Vector2D(canvasWidth / 2, canvasHeight / 2)
  }

  /**
   * Updates the specified player's tracking position.
   * @param {import('./physics/vector2d').default} playerPos The player's current
   * position.
   */
  updateTrackingPosition (playerPos) {
    this.playerPosition = Vector2D.sub(playerPos, this.canvasOffset)
  }

  /**
   * Performs a physics update.
   * @param {number} deltaTime The timestep to perform the update with.
   */
  update (deltaTime) {
    this.velocity = Vector2D
      .sub(this.playerPosition, this.position)
      .scale(constants.GAME_CONSTANTS.VIEWPORT_STICKINESS * deltaTime)

    this.position.add(this.velocity)
  }

  /**
   * Converts an absolute world coordinate to a position on the canvas in this
   * viewport's field of view.
   * @param {Vector2D} position The absolute world coordinate to convert.
   * @returns {Vector2D}
   */
  toCanvas (position) {
    return Vector2D.sub(position, this.position)
  }

  /**
   * Converts a canvas coordinate to an absolute world coordinate in this
   * viewport's field of view.
   * @param {Vector2D} position The canvas coordinate to convert.
   * @returns {Vector2D}
   */
  toWorld (position) {
    return Vector2D.add(position, this.position)
  }

  /**
   * Factory method for a Viewport object.
   * @param {HTMLCanvasElement} canvas
   * The canvas element to attach this viewport object to.
   * @returns {Viewport}
   */
  static create (canvas) {
    return new Viewport(
      Vector2D.zero(), Vector2D.zero(),
      canvas.width, canvas.height
    )
  }
}
