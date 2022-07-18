/* eslint-env browser */
/**
 * @fileoverview InputManager class to manage and report the current client inputs.
 */

import debugFactory from 'debug'

import EventEmitter from '../../helpers/event-emitter.js'

const debug = debugFactory('cw-client:input:manager')

/**
 * @typedef {Object} InputState
 * @prop {null} mouse
 * @prop {Record<string, boolean>} keys An object of which bindings have and have
 * not been toggled.
 *
 * @typedef {Object} InputManagerOptions
 * @prop {import('./input-tracker').default} tracker The input tracker object to use.
 * @prop {DirectionBindings} directionBindings
 */

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
    const { tracker } = opts

    super()

    this._mouseClicks = 0
    this._tracker = tracker

    /**
     * A map of all the bound keys and their respective names.
     * @type {Map<string, string>}
     * @private
     */
    this._bindings = new Map()

    this._tracker.on('input', this._onInput.bind(this))
  }

  /**
   * Processes an input event.
   * @param {import('./input-tracker').InputState} state The current input state.
   * @private
   */
  _onInput (state) {
    if (state.inputType === 'mouse') {
      // Ignore mouse input for now.
      return
    }

    const ret = {
      mouse: null,
      keys: {}
    }
    for (const [key, name] of this._bindings.entries()) {
      ret.keys[name] = state.keysPressed.includes(key)
    }

    this.emit('input', ret)
  }

  /**
   * Binds the specified key to a name.
   *
   * Whenever the key is pressed/unpressed, the name will be used to refer to it.
   * @param {string} key The key to bind.
   * @param {string} to The name of the binding.
   */
  bind (key, to) {
    if (this._bindings.has(key)) {
      throw new Error('Binding already exists!')
    }

    this._bindings.set(key, to)

    debug('Bound key "%s" to name "%s"', key, to)
  }

  /**
   * Unbinds the specified key.
   *
   * This allows keys to be bound again at a later time.
   * @param {string} key The key to unbind.
   */
  unbind (key) {
    this._bindings.delete(key)

    debug('Unbound key "%s"', key)
  }

  /**
   * Gets the key associated with the specified binding, or null if none exists.
   * @param {string} binding The name of the binding.
   * @returns {string|null}
   */
  getKey (binding) {
    for (const [key, name] of this._bindings.entries()) {
      if (name === binding) {
        return key
      }
    }

    return null
  }
}
