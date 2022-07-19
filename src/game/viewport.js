/* eslint-env browser */
/**
 * @fileoverview Viewport class to manage client viewport.
 */

import constants from '../constants.js'
import { Vector2D } from 'colonialwars-lib/math'

/**
 * Viewport class.
 */
export default class Viewport {
  /**
   * Constructor for a Viewport object.
   *
   * The position of the viewport will hold the absolute world coordinates for
   * the top left of the view (which correspond to canvas coordinates
   * ``[width / 2, height / 2]``).
   * @param {HTMLCanvasElement} canvas The canvas element this viewport will take
   * the height and width from.
   */
  constructor (canvas) {
    this.position = Vector2D.zero()
    this.velocity = Vector2D.zero()
    this.canvasOffset = new Vector2D(canvas.width / 2, canvas.height / 2)

    this.playerPosition = null
  }

  /**
   * Updates the specified player's tracking position.
   * @param {Vector2D} playerPos The player's current position.
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
}
