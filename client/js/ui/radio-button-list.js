/* eslint-env browser */
/**
 * @fileoverview RadioButtonList class for creating visual lists
 * of radio buttons.
 */

import { removeAllChildNodes } from '../helpers/dom-helpers.js'
import EventEmitter from '../helpers/event-emitter.js'

/**
 * @typedef {'itemWidth'|'itemHeight'|'show'} RadioButtonConfigKeys
 *
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

    this._needsUpdate = false
    this._config = {
      itemWidth: 200,
      itemHeight: 40,
      show: false
    }

    /** @type {HTMLDivElement} */
    this.listContainer = RadioButtonList.ELEMS.listContainer.cloneNode()

    this._init()
  }

  /**
   * Gets the selected value.
   * @returns {string}
   */
  get selected () {
    return this.listContainer.querySelector(`input[name=${this.name}]:checked`)?.value
  }

  /**
   * Attaches the required event listeners for the specified list item.
   * @param {HTMLLabelElement} label The item to attach event listeners to.
   * @private
   */
  _attachEventListeners (label) {
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
   * Initialize this RadioButtonList.
   * @private
   */
  _init () {
    this.listContainer.id = `radio-list-${this.name}`
  }

  /**
   * Attaches this RadioButtonList to the specified parent node.
   * @param {Element} parent The parent node to attach to.
   * @returns {RadioButtonList}
   */
  attach (parent) {
    parent.appendChild(this.listContainer)
    return this
  }

  /**
   * Update dimensions and visibility of this RadioButtonList.
   * @returns {RadioButtonList}
   */
  update () {
    if (!this._needsUpdate) {
      // Doesn't need an update.
      return
    }
    for (const item of this.listContainer.children) {
      if (!(item instanceof HTMLLabelElement)) {
        // Only modify label elements.
        continue
      }
      item.style.width = `${this._config.itemWidth}px`
      item.style.height = `${this._config.itemHeight}px`
    }

    // Now, either show or hide the radio button list.
    if (this._config.show) {
      this.listContainer.style.display = 'block'
    } else {
      this.listContainer.style.display = 'none'
    }

    return this
  }

  /**
   * Gets a configuration. Does NOT re-render, obviously.
   * @param {RadioButtonConfigKeys} key The configuration name.
   * @returns {any}
   */
  get (key) {
    if (!RadioButtonList.CONFIG_KEYS.legalKeys.includes(key)) {
      throw new Error(
        'Configuration does not exist!'
      )
    } else {
      return this._config[key]
    }
  }

  /**
   * Sets a configuration. Re-renders as needed.
   * @param {RadioButtonConfigKeys} key The configuration name.
   * @param {any} val The value to set.
   * @returns {RadioButtonList}
   */
  set (key, val) {
    if (!RadioButtonList.CONFIG_KEYS.legalKeys.includes(key)) {
      throw new TypeError(
        'Invalid configuration key!'
      )
    }
    this._config[key] = val
    this._needsUpdate = true

    return this
  }

  /**
   * Modify or create a new radio button.
   * @param {string} id The ID of the radio button to set.
   * @param {RadioButtonOptions} opts Options.
   * @returns {RadioButtonList}
   */
  setRadioButton (id, opts) {
    let item = this.listContainer.querySelector(`#${id}-label`)
    let input = this.listContainer.querySelector(`#${id}`)

    if (item instanceof HTMLLabelElement && input instanceof HTMLInputElement) {
      input.value = opts.value
      input.checked = opts.checked
      removeAllChildNodes(item)
      item.appendChild(document.createTextNode(opts.labelContent))
      item.appendChild(input)
      item.appendChild(RadioButtonList.ELEMS.checkmarkSpan.cloneNode(true))
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
        'radio-list__item',
        // 'ui-no-bold',
        'ui-content',
        'ui-content--radius',
        'ui-content--light'
      )
      item.appendChild(document.createTextNode(opts.labelContent))
      item.appendChild(input)
      item.appendChild(RadioButtonList.ELEMS.checkmarkSpan.cloneNode(true))
      this._attachEventListeners(item)

      this.listContainer.appendChild(item)
    }

    return this
  }

  /**
   * Deletes the specified radio button. Returns true if the radio button was
   * deleted sucessfully, false otherwise.
   * @param {string} id The ID of the radio button.
   */
  deleteRadioButton (id) {
    const item = this.listContainer.querySelector(`#${id}-label`)
    if (!(item instanceof HTMLLabelElement)) {
      // Doesn't exist.
      return false
    }

    this.listContainer.removeChild(item)
    return true
  }
}

RadioButtonList.CONFIG_KEYS = {
  legalKeys: ['itemWidth', 'itemHeight', 'show']
}
RadioButtonList.ELEMS = {
  listContainer: (() => {
    const listContainer = document.createElement('div')
    listContainer.setAttribute('role', 'radiogroup')
    return listContainer
  })(),
  checkmarkSpan: (() => {
    const checkmarkSpan = document.createElement('span')
    checkmarkSpan.classList.add('radio-list__checkmark')
    return checkmarkSpan
  })()
}
