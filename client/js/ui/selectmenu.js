/* eslint-env browser */
/**
 * @fileoverview Selectmenu class to control the appearance of the native
 * HTML select menu.
 */

import { removeAllChildNodes } from '../helpers/dom-helpers.js'

/**
 * @typedef {Object} OptionConfig
 * @prop {boolean} [selected]
 * @prop {boolean} [modify]
 * @prop {boolean} [delete]
 * @prop {boolean} [add]
 * @prop {string} [content]
 * @prop {string} [value]
 */

/**
 * Selectmenu class.
 */
export default class Selectmenu {
  /**
   * Create a new Selectmenu object.
   *
   * A Selectmenu object allows for easy manipulation and styling of the native
   * HTML ``<select>`` element.
   * @param {HTMLSelectElement} selectElem The HTML select element to work with.
   */
  constructor (selectElem) {
    this._select = selectElem
  }

  /**
   * Gets the selected value.
   * @returns {string}
   */
  get selected () {
    return this._select.value
  }

  /**
   * Apply the required styles to this Selectmenu's select element.
   *
   * This method applies the ``custom-select``, ``ui-content``,
   * ``ui-content--radius``, and ``ui-content--light`` styles.
   */
  applyStyles () {
    this._select.classList.add(
      'custom-select',
      'ui-content',
      'ui-content--radius',
      'ui-content--light'
    )
  }

  /**
   * Set or get the width of this Selectmenu, in pixels.
   * @param {number} [width] The width to give the select element.
   * @returns {number}
   */
  width (width) {
    if (typeof width === 'number' && !isNaN(width) && isFinite(width)) {
      this._select.style.width = `${width}px`
    }
    return width || parseInt(this._select.style.width, 10)
  }

  /**
   * Set or get the height of this Selectmenu.
   * @param {number} [height] The height to give the select element.
   * @returns {number}
   */
  height (height) {
    if (typeof height === 'number' && !isNaN(height) && isFinite(height)) {
      this._select.style.height = `${height}px`
    }
    return height || parseInt(this._select.style.height, 10)
  }

  /**
   * Set or get the drop down arrow source of this Selectmenu.
   * @param {string} [src] The drop down arrow source to give the select element.
   * @returns {string}
   */
  dropDownArrowSrc (src) {
    if (typeof src === 'string') {
      this._select.style.backgroundImage = `url("${src}")`
    }
    return src || this._select.style.backgroundImage.slice(5, -2)
  }

  /**
   * Set or get whether this Selectmenu is being shown.
   * @param {boolean} [shown] Whether to show the select element.
   * @returns {boolean}
   */
  shown (shown) {
    if (typeof shown === 'boolean') {
      this._select.style.display = shown
        ? 'block'
        : 'none'
    }

    return shown || this._select.style.display === 'block'
  }

  /**
   * Sets an option for this selectmenu.
   * @param {string} id The ID of the option to modify.
   * @param {OptionConfig} config Configurations for setting the option in the selectmenu.
   */
  setOption (id, config) {
    let option = this._select.querySelector(`#${id}`)
    if (!option && config.add) {
      // If the option doesn't already exist, the user wants us to add it.
      option = new Option(config.content, config.value, config.selected, config.selected)
      option.id = id
      this._select.appendChild(option)
      return this
    } else if (option && config.delete) {
      this._select.removeChild(option)
      return this
    } else if (option && config.modify) {
      option.selected = config.selected || option.selected
      option.value = config.value || option.value
      if (typeof config.content === 'string') {
        removeAllChildNodes(option)
        option.appendChild(document.createTextNode(config.content))
      }
      return this
    }
    throw new Error(
      `Failed to set option #${id}, with config ${JSON.stringify(config, null, 2)}`
    )
  }

  /**
   * Disables the option with ID ``id``. Returns true if successful, false
   * otherwise.
   * @param {string} id The ID of the option to disable.
   * @returns {boolean}
   */
  disableOption (id) {
    const option = this._select.querySelector(`#${id}`)
    if (!(option instanceof HTMLOptionElement)) {
      // Option doesn't exist.
      return false
    }

    option.disabled = true
    return true
  }
}
