/**
 * @fileoverview Port of the Node.JS EventEmitter API to the browser.
 * @author Horton Cheng <horton0712@gmail.com>
 */

/**
 * @callback ListeningListener
 * @param {...any} [args] Arguments.
 * @returns {void}
 */
/**
 * The default amount of maximum listeners on
 * a single instance of the EventEmitter class.
 * @type {10}
 * @readonly
 */
export const DEFAULT_MAX_LISTENERS = 10
/**
 * EventEmitter class.
 */
export default class EventEmitter {
  /**
   * Constructor for an EventEmitter class.
   */
  constructor () {
    /**
     * @type {Object<string, Array<ListeningListener>>}
     */
    this.listeners = {}

    this.maxListeners = DEFAULT_MAX_LISTENERS
  }

  /**
   * Adds an event listener.
   * @param {string} type The type of the event.
   * @param {ListeningListener} callback The callback to call.
   */
  addListener (type, callback) {
    if (!(type in this.listeners)) {
      this.listeners[type] = []
    }
    // Give a warning if the listeners listening for a specific event exceeds
    // the maximum number of listeners on an event.
    if (this.listeners[type].length > this.maxListeners) {
      console.warn('Exceeded max listeners on event: ', type)
    }
    this.listeners[type].push(callback)
  }

  /**
   * Dispatches an event.
   * @param {string} event The event to dispatch.
   * @param  {...any} [args] Arguments.
   * @returns {boolean}
   */
  dispatchEvent (event, ...args) {
    if (!(event in this.listeners)) {
      return false
    }
    // Copy the stack of event listeners... though not sure why
    // we need to do that.
    const stack = this.listeners[event].slice()

    // Call all the listeners in order.
    // TODO: See if a for...of loop would do well here.
    for (let i = 0, l = stack.length; i < l; i++) {
      stack[i].call(this, ...args)
    }
    return true
  }

  /**
   * Emits an event on this EventEmitter.
   * @param {string} event The event to emit.
   * @param  {...any} [args] Arguments.
   * @returns {boolean}
   */
  emit (event, ...args) {
    return this.dispatchEvent(event, ...args)
  }

  /**
   * Alias for ``emitter.addListener()``.
   * @param {string} type The type of the event.
   * @param {ListeningListener} callback The callback to call.
   */
  on (type, callback) {
    this.addListener(type, callback)
  }

  /**
   * Alias for ``emitter.removeListener()``.
   * @param {string} type The type of the event.
   * @param {ListeningListener} callback The callback to call.
   */
  off (type, callback) {
    this.removeListener(type, callback)
  }

  /**
   * Removes a listener.
   * @param {string} type The type of the event.
   * @param {ListeningListener} callback The listening listener.
   */
  removeListener (type, callback) {
    if (!(type in this.listeners)) {
      return
    }
    const stack = this.listeners[type]
    // TODO: Also see if this could be replaced by a for...of loop.
    for (let i = 0, l = stack.length; i < l; i++) {
      if (stack[i] === callback) {
        stack.splice(i, 1)
        return
      }
    }
  }

  /**
   * Removes all listeners from ``type``. If type is not specified,
   * removes all listeners of all events registered on this ``emitter``.
   * @param {string} [type] The type of the event.
   */
  removeAllListeners (type) {
    if (!type) {
      for (const key of Object.keys(this.listeners)) {
        delete this.listeners[key]
      }
      return
    }

    if (!(type in this.listeners)) {
      return
    }

    delete this.listeners[type]
  }
}
