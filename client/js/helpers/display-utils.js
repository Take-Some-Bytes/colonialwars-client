/* eslint-env browser */
/**
 * @fileoverview Utilities for displaying stuff to the user.
 */

import EventEmitter from './event-emitter.js'

import { ValidationError } from '../validation/validator.js'

/**
 * @typedef {import('../validation/validator').ValidationError} ValidationError
 *
 * @typedef {Object} ErrorDisplayerOptions
 * @prop {Element} elem
 * @prop {Array<string>} [classes]
 */

/**
 * ErrorDisplayer class.
 */
export class ErrorDisplayer {
  /**
   * Constructor for an ErrorDisplayer class. This class
   * displays validation errors.
   * @param {ErrorDisplayerOptions} opts Options.
   */
  constructor (opts) {
    const { elem, classes } = opts

    this.classes = classes || []

    this._errorMsg = null

    this.elem = elem
  }

  /**
   * Displays the specified error.
   * @param {Error} error The error to display.
   * @param {boolean} isValidationErr Whether the error is a validation error.
   */
  display (error, isValidationErr) {
    this.classes.forEach(cls => {
      this.elem.classList.add(cls)
    })

    if (isValidationErr && error instanceof ValidationError) {
      this._errorMsg = document.createTextNode(
        `${error.message} To fix this issue, ${error.toFix.toLowerCase()}`
      )
    } else {
      this._errorMsg = document.createTextNode(
        error.message
      )
    }
    this.elem.appendChild(this._errorMsg)
  }

  /**
   * Undisplays the displayed error.
   */
  undisplay () {
    this.classes.forEach(cls => {
      this.elem.classList.remove(cls)
    })
    console.log(this._errorMsg)
    if (this._errorMsg instanceof Text && this.elem.contains(this._errorMsg)) {
      this.elem.removeChild(this._errorMsg)
      this._errorMsg = null
      console.log(this._errorMsg)
    }
  }

  /**
   * Sets the element which this ErrorDisplayer is attached to.
   * @param {Element} newElem The new element to display errors on.
   */
  setElem (newElem) {
    this.elem = newElem
  }
}

/**
 * ViewportDimensions class to store the current viewport dimensions.
 * @extends EventEmitter
 */
export class ViewportDimensions extends EventEmitter {
  /**
   * Constructor for a ViewportDimensions class.
   */
  constructor () {
    super()
    this.width = 0
    this.height = 0

    // Get initial viewport dimensions.
    this.update()
  }

  /**
   * Updates the stored viewport dimensions.
   */
  update () {
    if (window.innerWidth !== undefined) {
      this.width = window.innerWidth
    } else {
      this.width = document.documentElement.clientWidth
    }

    if (window.innerHeight !== undefined) {
      this.height = window.innerHeight
    }
    this.height = document.documentElement.clientHeight

    this.emit('update')
  }
}

/**
 * Return the X/Y coordinates that will center an element with the specified
 * dimensions if placed using the top left corner.
 * @param {Record<'width'|'height', number>} elemDimensions
 * The element to calculate with.
 * @param {import('./display-utils').ViewportDimensions} vwDimensions
 * The current viewport dimensions.
 * @returns {Record<'x'|'y', number>}
 */
export function centerPos (elemDimensions, vwDimensions) {
  return {
    x: Math.round(
      vwDimensions.width / 2
    ) - elemDimensions.width / 2,
    y: Math.round(
      vwDimensions.height / 2
    ) - elemDimensions.height / 2
  }
}
