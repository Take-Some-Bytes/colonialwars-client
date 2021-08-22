/* eslint-env browser */
/**
 * @fileoverview InputManager class to manage and report the current client inputs.
 */

import Vector2D from '../physics/vector2d.js'
import InputTracker from './input-tracker.js'
import EventEmitter from '../../helpers/event-emitter.js'

/**
 * @typedef {Record<string, Array<string>>} KeyBindings
 * @typedef {Record<'up'|'down'|'left'|'right', Array<string>>} DirectionBindings
 *
 * @typedef {Object} InputState
 * @prop {BasicInputState} basic
 *
 * @typedef {Object} DirectionState
 * @prop {boolean} up
 * @prop {boolean} down
 * @prop {boolean} left
 * @prop {boolean} right
 *
 * @typedef {Object} MouseState
 * @prop {boolean} leftMousePressed
 * @prop {boolean} rightMousePressed
 * @prop {Vector2D} mouseCoords
 *
 * @typedef {Object} BasicInputState
 * @prop {DirectionState} directionData
 * @prop {MouseState} mouseData
 *
 * @typedef {Object} InputManagerOptions
 * @prop {InputTracker} inputTracker The input tracker object to use.
 * @prop {DirectionBindings} directionBindings
 */

/**
 * Array of valid directions.
 * @type {[
 * 'up',
 * 'down',
 * 'left',
 * 'right'
 * ]}
 */
export const VALID_DIRECTIONS = [
  'up',
  'down',
  'left',
  'right'
]

/**
 * InputManager class.
 */
export default class InputManager extends EventEmitter {
  /**
   * Constructor for an InputManager class. The InputManager class manages client
   * inputs, and reports them when requested.
   * @param {InputManagerOptions} opts Options.
   */
  constructor (opts) {
    const { inputTracker, directionBindings } = opts

    super()

    this.tracker = inputTracker
    this.mouseClicks = 0
    this.directionBindings = directionBindings

    this.tracker.on('input', this._onInput.bind(this))
  }

  /**
   * Processes an input event.
   * @param {import('./input-tracker').InputState} state The current input state.
   * @private
   */
  _onInput (state) {
    if (state.inputType === 'mouse') {
      // Ignore mouse input events for now.
      return
    }
    const directionData = this._getDirectionState(state.keysPressed)

    this.emit('input', {
      basic: {
        directionData
      }
    })
  }

  /**
   * Gets the direction state.
   * @param {Array<string>} keysPressed The keys that were pressed.
   * @returns {DirectionState}
   * @private
   */
  _getDirectionState (keysPressed) {
    const state = {
      up: false,
      down: false,
      left: false,
      right: false
    }

    const directions = Object.keys(this.directionBindings)
    for (const direction of directions) {
      if (!VALID_DIRECTIONS.includes(direction)) {
        continue
      }

      const bindings = this.directionBindings[direction]
      for (const binding of bindings) {
        if (keysPressed.includes(binding)) {
          state[direction] = true
        }
        /**
         * XXX: See if we'll need to set the respective state prop to false.
         * (04/19/2021) Take-Some-Bytes */
      }
    }

    return state
  }

  /**
   * Factory method for creating an InputManager.
   * @param {DirectionBindings} directionBindings The key bindings for movement.
   * @param {Element} keyElem The element to track key presses on.
   * @param {Element} mouseElem The element to track mouse input on.
   */
  static create (directionBindings, keyElem, mouseElem) {
    return new InputManager({
      inputTracker: InputTracker.create(keyElem, mouseElem),
      directionBindings: directionBindings
    })
  }
}
