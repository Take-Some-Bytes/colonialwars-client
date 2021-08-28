/* eslint-env browser */
/**
 * @fileoverview Simple class for creating dialogs.
 */

import EventEmitter from '../helpers/event-emitter.js'

import { makeDraggable, removeAllChildNodes } from '../helpers/dom-helpers.js'

/**
 * @typedef {(
 * 'width'|'height'|'x'|'y'|
 * 'title'|'draggable'|'isModal'|
 * 'show'|'renderTarget'|
 * 'min-height'|'min-width'
 * )} DialogConfigKeys
 * @typedef {(e: Event) => void | Promise<void>} ButtonCallback
 *
 * @typedef {Object} DialogRender
 * @prop {DocumentFragment} content
 * @prop {'dialog-render'} type
 * @prop {boolean} needsApply
 *
 * @typedef {Object} RenderedButton
 * @prop {string} name
 * @prop {ButtonCallback} callback
 * @prop {HTMLButtonElement} button
 *
 */

// An array of the names of functions of a ``Map`` that modify the ``Map``.
const MAP_MODIFING_KEYS = [
  'set', 'clear', 'delete'
]

/**
 * Dialog class.
 * @extends EventEmitter
 */
export default class Dialog extends EventEmitter {
  /**
   * Create a new Dialog object.
   *
   * A Dialog object makes it very easy to create dialogs/modals.
   * @param {string} name A unique name for this dialog.
   */
  constructor (name) {
    super()

    this.name = name

    this._dragHandle = null
    this._parentElem = null
    this._needsUpdate = false

    /**
     * A cache of the last rendered buttons.
     * @type {Record<string, RenderedButton>}
     */
    this._lastRenderedButtons = {}
    /**
     * A map of buttons to render, and their respective callbacks.
     * @type {Map<string, ButtonCallback>}
     * @private
     */
    this._buttons = new Map()
    this._config = {
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

    /** @type {HTMLDivElement} */
    this.container = Dialog.ELEMS.container.cloneNode()
    /** @type {HTMLDivElement} */
    this.contentContainer = Dialog.ELEMS.contentContainer.cloneNode()
    /** @type {HTMLElement} */
    this.header = Dialog.ELEMS.header.cloneNode()
    /** @type {HTMLSpanElement} */
    this.titleSpan = Dialog.ELEMS.titleSpan.cloneNode()
    /** @type {HTMLElement} */
    this.buttonPane = Dialog.ELEMS.buttonPane.cloneNode()

    this._init()
  }

  /**
   * Initializes this Dialog.
   * @private
   */
  _init () {
    const container = this.container
    container.id = `${this.name}-dialog__container`

    container.appendChild(this._initHeader())
    container.appendChild(this._initContent())
    container.appendChild(this._initButtonPane())
  }

  /**
   * Initializes and returns the dialog header.
   * @returns {HTMLElement}
   * @private
   */
  _initHeader () {
    const header = this.header
    const headerSpan = this.titleSpan
    header.id = `${this.name}-dialog__header`
    headerSpan.id = `${this.name}-dialog__header__title-span`

    header.appendChild(headerSpan)
    header.appendChild(this._initCloseButton())

    return header
  }

  /**
   * Initialize and return the dialog close button.
   * @returns {HTMLButtonElement}
   * @private
   */
  _initCloseButton () {
    const closeButton = Dialog.ELEMS.closeButton.cloneNode()
    const closeSpan = Dialog.ELEMS.closeSpan.cloneNode()
    const closeTxt = Dialog.ELEMS.closeText.cloneNode()

    closeSpan.id = `${this.name}-dialog__close-button__x-span`
    closeButton.id = `${this.name}-dialog__close-button`
    closeButton.type = 'button'

    closeButton.addEventListener('click', e => {
      this.dispatchEvent('closeButtonClick', e)
    })

    closeSpan.appendChild(closeTxt)
    closeButton.appendChild(closeSpan)

    return closeButton
  }

  /**
   * Initializes and returns the dialog content container.
   * @returns {HTMLDivElement}
   * @private
   */
  _initContent () {
    const contentContainer = this.contentContainer
    contentContainer.id = `${this.name}-dialog__content__container`

    return contentContainer
  }

  /**
   * Initializes and returns the dialog button pane.
   * @returns {HTMLElement}
   * @private
   */
  _initButtonPane () {
    const buttonPane = this.buttonPane
    buttonPane.id = `${this.name}-dialog__button-pane`

    return buttonPane
  }

  /**
   * A map of buttons to render, and their respective callbacks.
   * @type {Map<string, (e: Event) => void | Promise<void>>}
   */
  get buttons () {
    const self = this

    // Capture calls to ``this.buttons.set`` so we know we have to re-render.
    return new Proxy(this._buttons, {
      get (target, key, receiver) {
        const prop = Reflect.get(target, key, receiver)
        if (typeof prop !== 'function' || !MAP_MODIFING_KEYS.includes(prop.name)) {
          // Let it through.
          return prop
        }

        return function (...args) {
          self._needsUpdate = true
          return prop.call(target, ...args)
        }
      }
    })
  }

  /**
   * Render a group of buttons for this Dialog.
   * @returns {HTMLDivElement}
   * @private
   */
  _renderButtonGroup () {
    const buttonGroup = Dialog.ELEMS.buttonGroup.cloneNode()

    for (const [name, callback] of this._buttons.entries()) {
      const rendered = this._lastRenderedButtons[name]
      if (!rendered) {
        // Hasn't been rendered before. Render it.
        const button = document.createElement('button')
        const buttonTxt = document.createTextNode(name)

        button.appendChild(buttonTxt)

        button.addEventListener('click', callback)
        button.style.margin = '0.4rem'
        button.classList.add(
          'ui-content',
          'ui-content--radius',
          'ui-button',
          'ui-button--small',
          'ui-light'
        )
        buttonGroup.appendChild(button)

        // Cache the rendered button.
        this._lastRenderedButtons[name] = {
          button: button.cloneNode(true),
          callback,
          name
        }
        continue
      }

      // Button has been rendered.
      if (rendered.callback !== callback) {
        // Replace the button callback.
        rendered.callback = callback
      }
      rendered.button.addEventListener('click', rendered.callback)
      buttonGroup.appendChild(rendered.button)

      rendered.button = rendered.button.cloneNode(true)
    }

    // Prune old buttons from button cache.
    this._lastRenderedButtons = Object.fromEntries(
      Object.entries(this._lastRenderedButtons)
        .filter(([key]) => this._buttons.has(key))
    )

    return buttonGroup
  }

  /**
   * Render this Dialog's modal overlay.
   * @returns {HTMLDivElement}
   * @private
   */
  _renderOverlay () {
    const overlay = Dialog.ELEMS.overlay.cloneNode()
    overlay.id = `${this.name}-dialog__overlay`

    return overlay
  }

  /**
   * Gets a configuration.
   * @param {DialogConfigKeys} key The configuration name.
   * @returns {any}
   */
  get (key) {
    if (Dialog.CONFIG_KEYS.legalKeys.includes(key)) {
      throw new Error(
        'Configuration does not exist!'
      )
    } else if (['width', 'height'].includes(key)) {
      return this._config.dimensions[key]
    } else if (['x', 'y'].includes(key)) {
      return this._config.position[key]
    } else {
      return this._config[key]
    }
  }

  /**
   * Sets a configuration.
   * @param {DialogConfigKeys} key The configuration name.
   * @param {any} val The value to set.
   * @returns {Dialog}
   */
  set (key, val) {
    if (!Dialog.CONFIG_KEYS.legalKeys.includes(key)) {
      throw new TypeError(
        'Invalid configuration key!'
      )
    }

    if (Dialog.CONFIG_KEYS.nestedKeys.includes(key)) {
      // Actual configuration is nested inside other objects,
      // so it receives special treatment.
      // Also, all nested keys expect number values.
      if (typeof val !== 'number') {
        throw new TypeError(
          `Expected val to be type of number. Received type ${typeof val}.`
        )
      }

      if (['width', 'height'].includes(key)) {
        this._config.dimensions[key] = val
      } else if (['x', 'y'].includes(key)) {
        this._config.position[key] = val
      } else if (['min-width', 'min-height'].includes(key)) {
        this._config.minDimensions[key.slice(4)] = val
      }
    } else {
      this._config[key] = val
    }

    this._needsUpdate = true

    return this
  }

  /**
   * Sets the content of the dialog.
   * @param {Node} content The content to set.
   * @param {boolean} [append=true] Whether to append the content onto existing elements.
   * @returns {Dialog}
   */
  setContent (content, append = true) {
    if (!append) {
      removeAllChildNodes(this.contentContainer)
    }

    this.contentContainer.appendChild(content)
    return this
  }

  /**
   * Update the position, dimensions, minimum dimensions, buttons, title and
   * visibility  of this dialog. The overlay is also added if the dialog is a
   * modal, and  removed otherwise. Draggability is also added or removed in
   * this function.
   * @prop {Record<'width'|'height', number} vwDimensions The current viewport
   * dimensions
   * @returns {Dialog}
   */
  update (vwDimensions) {
    // Update the position, dimensions, and minimum dimensions of the container.
    const container = this.container
    container.style.top = `${this._config.position.y}px`
    container.style.left = `${this._config.position.x}px`
    container.style.width = `${this._config.dimensions.width}px`
    container.style.height = `${this._config.dimensions.height}px`
    container.style.minWidth = `${this._config.minDimensions.width}px`
    container.style.minHeight = `${this._config.minDimensions.height}px`

    // Update title.
    removeAllChildNodes(this.titleSpan)
    this.titleSpan.appendChild(document.createTextNode(this._config.title))

    // Update container visibility.
    if (this._config.show) {
      // Show the dialog.
      container.style.display = 'flex'
    } else {
      // Don't show the dialog.
      container.style.display = 'none'
    }

    // Re-render buttons.
    removeAllChildNodes(this.buttonPane)
    this.buttonPane.appendChild(this._renderButtonGroup())

    // Make the element draggable... or not.
    if (this._config.draggable) {
      if (!this._dragHandle) {
        console.log('making draggable')
        this.header.style.cursor = 'move'
        this._dragHandle = makeDraggable(
          container, `${this.name}-dialog__header`,
          {
            x: { min: 0, max: vwDimensions.width },
            y: { min: 0, max: vwDimensions.height }
          }
        )
      }
    } else {
      if (this._dragHandle.undrag) {
        this.header.style.cursor = 'auto'
        this._dragHandle.undrag()
      }
    }

    // Add or remove overlay.
    // Only add/remove overlay if the dialog has been attached to a parent element.
    if (!(this._parentElem instanceof HTMLElement)) {
      return
    }

    const oldOverlay = this._parentElem.querySelector(
      `#${this.name}-dialog__overlay`
    )
    if (oldOverlay) {
      if (this._config.show && this._config.isModal) {
        // Leave the overlay.
        return
      }
      // Remove the overlay.
      this._parentElem.removeChild(oldOverlay)
      return
    }

    if (!this._config.show || !this._config.isModal) {
      // Don't show the overlay.
      return
    }
    // Render the overlay.
    this._parentElem.appendChild(this._renderOverlay())
  }

  /**
   * Attaches this Dialog to a parent element. The dialog overlay will also be
   * attached onto the specified parent element.
   * @param {HTMLElement} parent The element to attach to.
   * @returns {Dialog}
   */
  attach (parent) {
    this._parentElem = parent
    if (this._config.isModal && this._config.show) {
      // Render the overlay.
      this._parentElem.appendChild(this._renderOverlay())
    }
    this._parentElem.appendChild(this.container)

    return this
  }
}

Dialog.CONFIG_KEYS = {
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

// Initialize all needed dialog elements.
Dialog.ELEMS = {
  closeText: document.createTextNode('x'),
  header: (() => {
    const header = document.createElement('header')
    header.classList.add(
      'dialog__header',
      'ui-content',
      'ui-content--radius'
    )
    return header
  })(),
  container: (() => {
    const container = document.createElement('div')
    container.classList.add(
      'ui-content',
      'ui-content--radius',
      'dialog'
    )
    return container
  })(),
  contentContainer: (() => {
    const container = document.createElement('div')
    container.classList.add('dialog__content')
    return container
  })(),
  closeSpan: (() => {
    const closeSpan = document.createElement('span')
    closeSpan.classList.add('dialog__close-span')
    return closeSpan
  })(),
  titleSpan: (() => {
    const headerSpan = document.createElement('span')
    headerSpan.classList.add('dialog__header__title-span')
    return headerSpan
  })(),
  buttonPane: (() => {
    const buttonPane = document.createElement('footer')
    buttonPane.classList.add(
      'ui-content',
      'dialog__button-pane'
    )
    return buttonPane
  })(),
  closeButton: (() => {
    const closeButton = document.createElement('button')
    closeButton.type = 'button'
    closeButton.classList.add('dialog__close-button')
    return closeButton
  })(),
  overlay: (() => {
    const overlay = document.createElement('div')
    overlay.style.zIndex = '100'
    overlay.style.display = 'block'
    overlay.classList.add('dialog__overlay')
    return overlay
  })(),
  buttonGroup: (() => {
    const buttonGroup = document.createElement('div')
    buttonGroup.classList.add('dialog__button-group')
    return buttonGroup
  })()
}
