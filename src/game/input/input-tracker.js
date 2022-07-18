/* eslint-env browser */
/**
 * @fileoverview Low-level InputTracker class that tracks what keys are pressed,
 * what mouse buttons are pressed, and the current mouse position.
 */

import EventEmitter from '../../helpers/event-emitter.js'

/**
  * @typedef {Object} InputState
  * @prop {'key'|'mouse'} inputType
  * @prop {Array<string>} keysPressed
  * @prop {Object} mouseData
  * @prop {boolean} mouseData.leftMousePressed
  * @prop {boolean} mouseData.rightMousePressed
  * @prop {Array<number>} mouseData.mouseCoords
  */

/**
  * InputTracker class.
  * @extends EventEmitter
  */
export default class InputTracker extends EventEmitter {
  /**
    * Low-level InputTracker class that tracks what keys are pressed,
    * what mouse buttons are pressed, and the current mouse position.
    */
  constructor () {
    super()

    /**
      * @type {Array<string>}
      */
    this.keysPressed = []
    this.leftMouseDown = false
    this.rightMouseDown = false
    this.mousePosition = [0, 0]
  }

  /**
    * Event handler for the `keydown` event.
    * @param {KeyboardEvent} event The event to handle.
    */
  onKeyDown (event) {
    const key = event.key.toLowerCase()

    if (!this.keysPressed.includes(key)) {
      this.keysPressed.push(key)
    }
    const state = {
      inputType: 'key',
      keysPressed: this.keysPressed,
      mouseData: {
        leftMousePressed: this.leftMouseDown,
        rightMousePressed: this.rightMouseDown,
        mouseCoords: this.mousePosition
      }
    }
    this.emit('keyDown', key)
    this.emit('input', state)
  }

  /**
    * Event handler for the `keyup` event.
    * @param {KeyboardEvent} event The event to handle.
    */
  onKeyUp (event) {
    const key = event.key.toLowerCase()

    this.keysPressed.splice(key, 1)
    const state = {
      inputType: 'key',
      keysPressed: this.keysPressed,
      mouseData: {
        leftMousePressed: this.leftMouseDown,
        rightMousePressed: this.rightMouseDown,
        mouseCoords: this.mousePosition
      }
    }
    this.emit('keyUp', key)
    this.emit('input', state)
  }

  /**
    * Handles a `mousedown` event.
    * @param {MouseEvent} event The Mouse event to handle.
    */
  onMouseDown (event) {
    event.preventDefault()
    if (event.button === 0) {
      this.leftMouseDown = true
    }
    if (event.button === 1) {
      this.rightMouseDown = true
    }
    const state = {
      inputType: 'mouse',
      keysPressed: this.keysPressed,
      mouseData: {
        leftMousePressed: this.leftMouseDown,
        rightMousePressed: this.rightMouseDown,
        mouseCoords: this.mousePosition
      }
    }
    this.emit('mouseButtonDown', event.button)
    this.emit('input', state)
  }

  /**
    * Handles a `mouseup` event.
    * @param {MouseEvent} event The Mouse event to handle.
    */
  onMouseUp (event) {
    event.preventDefault()
    if (event.button === 0) {
      this.leftMouseDown = false
    }
    if (event.button === 1) {
      this.rightMouseDown = false
    }
    const state = {
      inputType: 'mouse',
      keysPressed: this.keysPressed,
      mouseData: {
        leftMousePressed: this.leftMouseDown,
        rightMousePressed: this.rightMouseDown,
        mouseCoords: this.mousePosition
      }
    }
    this.emit('mouseButtonUp', event.button)
    this.emit('input', state)
  }

  /**
    * Handles a `mousemove` event.
    * @param {MouseEvent} event The Mouse event to handle.
    */
  onMouseMove (event) {
    event.preventDefault()
    this.mousePosition[0] = event.offsetX
    this.mousePosition[1] = event.offsetY

    const state = {
      inputType: 'mouse',
      keysPressed: this.keysPressed,
      mouseData: {
        leftMousePressed: this.leftMouseDown,
        rightMousePressed: this.rightMouseDown,
        mouseCoords: this.mousePosition
      }
    }
    this.emit('mouseMove', this.mousePosition.slice())
    this.emit('input', state)
  }

  /**
    * Applies the event handlers to elements in the DOM.
    * @param {Element} keyElement The element to track keypresses on.
    * @param {Element} mouseClickElement The element to track mouse clicks on.
    * @param {Element} mouseMoveElement The element to track mouse movement
    * relative to.
    */
  applyEventHandlers (keyElement, mouseClickElement, mouseMoveElement) {
    keyElement.addEventListener('keydown', this.onKeyDown.bind(this))
    keyElement.addEventListener('keyup', this.onKeyUp.bind(this))
    mouseClickElement.addEventListener(
      'mousedown', this.onMouseDown.bind(this)
    )
    mouseClickElement.addEventListener('mouseup', this.onMouseUp.bind(this))
    mouseMoveElement.setAttribute('tabindex', 1)
    mouseMoveElement.addEventListener('mousemove', this.onMouseMove.bind(this))
  }

  /**
    * Factory method for an InputTracker class.
    * @param {Element} keyElement The element to listen for keypresses
    * and mouse clicks on.
    * @param {Element} mouseMoveElement The element to track mouse
    * coordinates relative to.
    * @returns {InputTracker}
    */
  static create (keyElement, mouseMoveElement) {
    const input = new InputTracker()
    input.applyEventHandlers(keyElement, keyElement, mouseMoveElement)
    return input
  }
}
