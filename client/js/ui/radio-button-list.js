/* eslint-env browser */
/**
 * @fileoverview RadioButtonList class for creating visual lists
 * of radio buttons.
 */

import * as domHelpers from '../helpers/dom-helpers.js'
import EventEmitter from '../event-emitter.js'

/**
 * @typedef {Object} RadioButtonOptions
 * @prop {string} value
 * @prop {string} labelContent
 * @prop {boolean} checked
 */

/**
 * RadioButtonList class.
 * @extends EventEmitter
 */
export default class RadioButtonList extends EventEmitter {
  /**
   * Constructor for a RadioButtonList class.
   * @param {string} name A unique name to refer to this radio button list.
   */
  constructor (name) {
    super()
    this.name = name

    this.listContainer = null
    this.checkmarkSpan = null
    this.rendered = false
    this.keys = {
      legalKeys: ['itemWidth', 'itemHeight', 'renderTarget', 'show']
    }
    this.config = {
      show: true,
      itemWidth: 200,
      itemHeight: 40,
      renderTarget: null
    }

    this._createElements()
  }

  /**
   * Gets the selected value.
   * @returns {string}
   */
  get selected () {
    return this.listContainer.querySelector(`input[name=${this.name}]:checked`).value
  }

  /**
   * Attaches the required event listeners for the specified list item.
   * @param {HTMLLabelElement} item The item to attach event listeners to.
   * @private
   */
  _attachEventListeners (item) {
    const label = item
    const itemInput = label.querySelector('input')
    label.addEventListener('input', () => {
      this.dispatchEvent('change', {
        inputSelected: itemInput,
        inputValue: itemInput.value,
        labelElem: label
      })
    })
  }

  /**
   * Creates the required HTML and Text nodes.
   * @private
   */
  _createElements () {
    this.listContainer = document.createElement('div')
    this.listContainer.id = `ui-radio-list-${this.name}`
    this.listContainer.setAttribute('role', 'radiogroup')

    this.checkmarkSpan = document.createElement('span')
    this.checkmarkSpan.classList.add('radio-list-checkmark')
  }

  /**
   * Sets dynamic properties.
   * @private
   */
  _setDynamicProps () {
    const listItems = Array.from(this.listContainer.children)
    const len = listItems.length
    for (let i = 0; i < len; i++) {
      const item = listItems[i]
      if (item instanceof HTMLLabelElement) {
        item.style.width = `${this.config.itemWidth}px`
        item.style.height = `${this.config.itemHeight}px`
      }
    }
  }

  /**
   * Private ``_render()`` method.
   * @private
   */
  _render () {
    if (this.config.renderTarget instanceof HTMLElement) {
      domHelpers.render(this.listContainer, this.config.renderTarget)
    } else {
      throw new TypeError(
        'renderTarget must be a HTMLElement to render radio button list!'
      )
    }
  }

  /**
   * Hides this RadioButtonList.
   */
  hide () {
    this.listContainer.style.display = 'none'

    this.rendered = false
    return this
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
    } else {
      return this.config[key]
    }
  }

  /**
   * Sets a configuration. Re-renders as needed.
   * @param {string} key The configuration name.
   * @param {any} val The value to set.
   * @returns {RadioButtonList}
   */
  set (key, val) {
    if (!this.keys.legalKeys.includes(key)) {
      throw new TypeError(
        'Invalid configuration key!'
      )
    }
    this.config[key] = val

    if (this.config.renderTarget instanceof HTMLElement) {
      // If renderTarget is set, we must re-render.
      this.render()
    }
    return this
  }

  /**
   * Sets an "option" (i.e. radio button). If it already exists, it is
   * overridden.
   * @param {string} id An unique ID for the option to add.
   * @param {RadioButtonOptions} opts Options for creating the radio button.
   * @returns {RadioButtonList}
   */
  setOption (id, opts) {
    let item = this.listContainer.querySelector(`#${id}-label`)
    let input = this.listContainer.querySelector(`#${id}`)

    const spanElem = document.createElement('span')
    spanElem.classList.add('radio-list-checkmark')

    if (item instanceof HTMLLabelElement && input instanceof HTMLInputElement) {
      input.value = opts.value
      input.checked = opts.checked
      domHelpers.removeAllChildNodes(item)
      item.appendChild(document.createTextNode(opts.labelContent))
      item.appendChild(input)
      item.appendChild(spanElem)
    } else {
      item = document.createElement('label')
      input = document.createElement('input')

      item.id = `${id}-label`
      item.htmlFor = id
      input.id = id
      input.type = 'radio'
      input.name = this.name
      input.checked = opts.checked
      input.value = opts.value
      item.style.display = 'block'
      item.classList.add(
        'radio-list-item-container',
        'ui-no-bold',
        'ui-content',
        'ui-radius',
        'ui-light'
      )
      item.appendChild(document.createTextNode(opts.labelContent))
      item.appendChild(input)
      item.appendChild(spanElem.cloneNode(true))
      this._attachEventListeners(item)
    }

    domHelpers.render(item, this.listContainer)

    if (this.config.renderTarget instanceof HTMLElement) {
      // If renderTarget is set, we must re-render.
      this.render()
    }

    return this
  }

  /**
   * Removes an "option" (i.e. radio button) from the list if it exists.
   * @param {string} id The ID of the option to remove.
   * @returns {RadioButtonList}
   */
  removeOption (id) {
    const item = this.listContainer.querySelector(`#${id}-label`)
    if (item instanceof HTMLLabelElement) {
      domHelpers.removeChildNode(item, this.listContainer)
    }
    return this
  }

  /**
   * Renders this radio button list.
   * @returns {RadioButtonList}
   */
  render () {
    if (!this.config.show) {
      if (this.rendered) {
        this.hide()
      }
      return this
    } else if (this.rendered) {
      this._setDynamicProps()
      return this
    }

    this.listContainer.style.display = 'block'

    this._setDynamicProps()
    this._render()
    this.rendered = true
    return this
  }
}
