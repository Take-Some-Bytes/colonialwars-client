/* eslint-env browser */
/**
 * @fileoverview Simple class for create dialogs.
 */

/**
 * @typedef {Object<string, ButtonCallback>} Buttons
 *
 * @typedef {Object} ViewportStats
 * @prop {number} width
 * @prop {number} height
 *
 * @callback ButtonCallback
 * @param {Event} e The event that happened (the click event).
 * @returns {void|Promise<void>}
 */

import * as domHelpers from '../helpers/dom-helpers.js'
import EventEmitter from '../event-emitter.js'

/**
 * Dialog class.
 */
export default class Dialog extends EventEmitter {
  /**
   * Constructor for a Dialog class.
   * @param {ViewportStats} viewportStats The dimensions of the viewport.
   * @param {string} name A unique name to refer to this dialog.
   */
  constructor (viewportStats, name) {
    super()

    this.viewportStats = viewportStats
    this.name = name

    this.rendered = false
    this.couldBeDragged = false
    /**
     * Any error that was encountered.
     * @type {*}
     */
    this.error = null
    this.header = null
    this.overlay = null
    this.container = null
    this.closeSpan = null
    this.closeText = null
    this.headerSpan = null
    this.headerText = null
    this.buttonPane = null
    this.closeButton = null
    this.contentContainer = null

    /**
     * @type {Buttons}
     */
    this.buttons = {}
    this.config = {
      title: 'Dialog',
      isModal: false,
      draggable: false,
      show: false,
      renderTarget: null,
      dimensions: {
        width: 200,
        height: 200
      },
      minDimensions: {
        width: 200,
        height: 200
      },
      position: {
        x: 0,
        y: 0
      }
    }
    /**
     * @param {MouseEvent} e
     */
    this.closeButtonHandler = e => {
      e.preventDefault()
      this.set('show', false)
    }
    // Define all information about setting configurations.
    this.keys = {
      legalKeys: [
        'width', 'height', 'x', 'y',
        'title', 'draggable', 'isModal',
        'show', 'renderTarget',
        'min-height', 'min-width'
      ],
      nestedKeys: [
        'width', 'height', 'x', 'y',
        'min-height', 'min-width'
      ]
    }

    this._createElements()
    this._init()
  }

  /**
   * Gets the content of the dialog.
   * @returns {Array<ChildNode>}
   */
  get content () {
    return Array.from(
      this.contentContainer.childNodes
    )
  }

  /**
   * Attaches all the elements of the dialog together.
   * @private
   */
  _attachElements () {
    try {
      this.closeSpan.appendChild(this.closeText)
      this.closeButton.appendChild(this.closeSpan)
      this.headerSpan.appendChild(this.closeButton)
      this.headerSpan.appendChild(this.headerText)
      this.header.appendChild(this.headerSpan)
      this.container.appendChild(this.header)
      this.container.appendChild(this.contentContainer)
      this.container.appendChild(this.buttonPane)
    } catch (ex) {
      this.error = ex
      this.dispatchEvent('error')
    }
  }

  /**
   * Updates dimensions and positions of this dialog.
   * @private
   */
  _updateDimensions () {
    this.container.style.left = `${this.config.position.x}px`
    this.container.style.top = `${this.config.position.y}px`
    this.container.style.height = `${this.config.dimensions.height}px`
    this.container.style.width = `${this.config.dimensions.width}px`
  }

  /**
   * Creates the buttons.
   * @private
   */
  _createButtons () {
    const buttonGroup = document.createElement('div')
    Object.keys(this.buttons).forEach(name => {
      const buttonFunc = this.buttons[name]
      const button = document.createElement('button')
      const buttonText = document.createTextNode(name)

      button.appendChild(buttonText)

      button.addEventListener('click', buttonFunc)
      button.classList.add(
        'ui-content',
        'ui-radius',
        'ui-button',
        'dialog-button'
      )
      buttonGroup.appendChild(button)
    })

    buttonGroup.classList.add('dialog-button-group')
    this.buttonPane.appendChild(buttonGroup)
  }

  /**
   * Creates dynamic HTML and Text elements and nodes.
   * @private
   */
  _createDynamicElems () {
    this.headerText = document.createTextNode(this.config.title)

    this.container.id = `ui-dialog-${this.name}`
    this.header.id = `ui-dialog-header-${this.name}`
    this.buttonPane.id = `ui-dialog-button-pane-${this.name}`
    this.headerSpan.id = `ui-dialog-header-span-${this.name}`
    this.closeButton.id = `ui-dialog-close-button-${this.name}`
    this.contentContainer.id = `ui-dialog-content-${this.name}`
    this.closeSpan.id = `ui-dialog-close-button-span-${this.name}`

    this.container.style.minHeight = `${this.config.minDimensions.height}px`
    this.container.style.minWidth = `${this.config.minDimensions.width}px`
    this.contentContainer.style.maxHeight =
      `${parseInt(this.container.style.height, 10) - this.header.clientHeight - this.buttonPane.clientHeight}px`
    this.contentContainer.style.overflow = 'auto'

    if (this.config.isModal && !(this.overlay instanceof HTMLDivElement)) {
      this.overlay = document.createElement('div')
      this._prepareOverlay()
    }
  }

  /**
   * Creates the required HTML and Text nodes.
   * @private
   */
  _createElements () {
    this.closeText = document.createTextNode('x')

    this.header = document.createElement('header')
    this.container = document.createElement('div')
    this.closeSpan = document.createElement('span')
    this.headerSpan = document.createElement('span')
    this.buttonPane = document.createElement('footer')
    this.closeButton = document.createElement('button')
    this.contentContainer = document.createElement('main')
  }

  /**
   * Initializes this Dialog instance.
   * @private
   */
  _init () {
    this.closeButton.type = 'button'
    this.closeButton.addEventListener('click', this.closeButtonHandler)

    this.contentContainer.classList.add('dialog-content')
    this.headerSpan.classList.add('dialog-header-span')
    this.closeSpan.classList.add('dialog-close-span')
    this.closeButton.classList.add(
      'ui-content',
      'ui-radius',
      'ui-button',
      'dialog-close-button'
    )
    this.buttonPane.classList.add(
      'ui-content',
      'dialog-button-pane'
    )
    this.container.classList.add(
      'ui-content',
      'ui-radius',
      'dialog-container'
    )
    this.header.classList.add(
      'dialog-header',
      'ui-content',
      'ui-radius'
    )

    this.dispatchEvent('initialized')
  }

  /**
   * Makes this dialog draggable, if needed.
   * @private
   */
  _makeDraggable () {
    if (this.config.draggable) {
      this.header.style.cursor = 'move'
      if (!this.couldBeDragged) {
        this.couldBeDragged = domHelpers.makeDraggable(
          this.container, this.header.id, {
            x: {
              min: 0, max: this.viewportStats.width
            },
            y: {
              min: 0, max: this.viewportStats.height
            }
          }
        )
      }
    } else {
      this.header.style.cursor = 'default'
    }
  }

  /**
   * Private method for rendering this dialog.
   * @private
   */
  _render () {
    if (this.config.renderTarget instanceof HTMLElement) {
      domHelpers.render(this.container, this.config.renderTarget)
      if (this.config.isModal && this.overlay instanceof HTMLDivElement) {
        domHelpers.render(this.overlay, this.config.renderTarget)
      }
    } else {
      throw new TypeError(
        'renderTarget must be a HTMLElement in order for this dialog to render!'
      )
    }
  }

  /**
   * Resets this dialog's position and dimensions.
   * @private
   */
  _reset () {
    domHelpers.removeAllChildNodes(this.headerSpan)
    domHelpers.removeAllChildNodes(this.buttonPane)

    try {
      this._updateDimensions()
    } catch (ex) {
      this.rendered = false
      this.error = ex
      this.dispatchEvent('error')
    }
  }

  /**
   * Prepares this dialog for rendering.
   * @private
   */
  _prepareDialog () {
    this._reset()
    this._createDynamicElems()
    this._createButtons()
    this._attachElements()
  }

  /**
   * Prepares the dialog overlay, if the dialog is supposed to be a modal.
   * @private
   */
  _prepareOverlay () {
    if (this.config.isModal) {
      if (this.overlay instanceof HTMLDivElement) {
        this.overlay.style.zIndex = '100'
        this.overlay.style.display = 'block'
        if (!this.overlay.classList.contains('ui-overlay')) {
          this.overlay.classList.add('ui-overlay')
        }
      }
    }
  }

  /**
   * Gets a configuration. Does NOT re-render, obviously.
   * @param {string} key The configuration name.
   * @returns {any}
   */
  get (key) {
    if (!this.keys.legalKeys.includes(key)) {
      throw new Error(
        'Configuration does not exist!'
      )
    } else if (['width', 'height'].includes(key)) {
      return this.config.dimensions[key]
    } else if (['x', 'y'].includes(key)) {
      return this.config.position[key]
    } else {
      return this.config[key]
    }
  }

  /**
   * Hides this dialog.
   * @returns {Dialog}
   */
  hide () {
    if (this.config.isModal && this.overlay instanceof HTMLDivElement) {
      domHelpers.removeChildNode(this.overlay, this.config.renderTarget)
    }
    this.container.style.display = 'none'
    this.rendered = false
    this.dispatchEvent('hidden')
    return this
  }

  /**
   * Refreshes the current buttons that are in the dialog.
   * @returns {Dialog}
   */
  refreshButtons () {
    domHelpers.removeAllChildNodes(this.buttonPane)
    this._createButtons()
    return this
  }

  /**
   * Removes a button.
   * @param {string} name The name of the button.
   * @returns {Dialog}
   */
  removeButton (name) {
    delete this.buttons[name]
    return this
  }

  /**
   * Sets a configuration. Re-renders as needed.
   * @param {string} key The configuration name.
   * @param {any} val The value to set.
   * @returns {Dialog}
   */
  set (key, val) {
    if (!this.keys.legalKeys.includes(key)) {
      throw new TypeError(
        'Invalid configuration key!'
      )
    }

    if (this.keys.nestedKeys.includes(key)) {
      // Actual configuration is nested inside other objects,
      // so it receives special treatment.
      // Also, all nested keys expect number values.
      if (typeof val !== 'number') {
        throw new TypeError(
          `Expected val to be type of number. Received type ${typeof val}.`
        )
      }

      if (['width', 'height'].includes(key)) {
        this.config.dimensions[key] = val
      } else if (['x', 'y'].includes(key)) {
        this.config.position[key] = val
      } else if (['min-width', 'min-height'].includes(key)) {
        this.config.minDimensions[key.substring(4)] = val
      }
    } else {
      this.config[key] = val
    }

    if (this.config.renderTarget instanceof HTMLElement) {
      // If renderTarget is set, we must re-render.
      this.render()
    }
    return this
  }

  /**
   * Sets a button. If the button exists, overwrite it. If it doesn't, add it.
   * @param {string} name The name of the button.
   * @param {ButtonCallback} callback The function to call when the button is pressed.
   * @returns {Dialog}
   */
  setButton (name, callback) {
    try {
      if (typeof name !== 'string') {
        throw new TypeError(
          'Name parameter must be a string!'
        )
      } else if (typeof callback !== 'function') {
        throw new TypeError(
          'Callback parameter must be a function!'
        )
      }

      this.buttons[name] = callback
    } catch (ex) {
      this.error = ex
      this.dispatchEvent('error')
    }
    return this
  }

  /**
   * Sets the content of the dialog.
   * @param {string|Node} content The content to set.
   * @param {boolean} [append=true] Whether to append the content onto existing elements.
   * @returns {Dialog}
   */
  setContent (content, append = true) {
    if (!append) {
      domHelpers.removeAllChildNodes(this.contentContainer)
    }

    if (typeof content === 'string') {
      this.contentContainer.insertAdjacentHTML(
        'afterbegin', content
      )
    } else if (content instanceof Node) {
      this.contentContainer.appendChild(content)
    }
    return this
  }

  /**
   * Renders this dialog.
   * @param {boolean} force Whether to force the render.
   * @returns {Dialog}
   */
  render (force) {
    try {
      if (!this.config.show && !force) {
        if (this.rendered) {
          this.hide()
        }
        return this
      } else if (this.rendered && !force) {
        // If dialog is already rendered, user probably wants to change
        // height or width (or x or y). In that case, do it.
        this._updateDimensions()
        return this
      }
      this._prepareDialog()
      this._render()
      this._makeDraggable()
      this.rendered = true
      this.dispatchEvent('rendered')
      return this
    } catch (ex) {
      this.rendered = false
      this.error = ex
      this.dispatchEvent('error')
      return this
    }
  }

  /**
   * Overrides the default action when the close button (the ``x`` button) is pressed.
   * @param {import('../event-emitter').ListeningListener} handler The handler
   * for the event.
   */
  onCloseButtonClick (handler) {
    this.closeButton.removeEventListener('click', this.closeButtonHandler)
    this.closeButtonHandler = handler
    this.closeButton.addEventListener('click', this.closeButtonHandler)
  }

  /**
   * Creates a new dialog.
   * @param {import('../constants').ClientConstants} constants Client side constants.
   * @param {string} name A unique name for the dialog to be created.
   * @param {Object<string, any>} config Any other configurations to apply to the dialog.
   * @returns {Dialog}
   */
  static create (constants, name, config) {
    const dialog = new Dialog({
      height: constants.VIEWPORT_HEIGHT,
      width: constants.VIEWPORT_WIDTH
    }, name)

    Object.keys(config).forEach(key => {
      dialog.set(key, config[key])
    })
    dialog
      .set('width', Math.round(constants.VIEWPORT_WIDTH / 3))
      .set('height', Math.round(constants.VIEWPORT_HEIGHT * 10 / 1.5 / 10)).set(
        'x',
        Math.round(constants.VIEWPORT_WIDTH / 2) - dialog.get('width') / 2
      ).set(
        'y',
        Math.round(constants.VIEWPORT_HEIGHT / 2) - dialog.get('height') / 2
      ).set(
        'title', name
      )

    return dialog
  }
}
