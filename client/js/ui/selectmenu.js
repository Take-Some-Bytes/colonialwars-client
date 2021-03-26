/* eslint-env browser */
/**
 * @fileoverview Selectmenu class to control the appearances of the native
 * HTML select menu.
 */

import * as domHelpers from '../helpers/dom-helpers.js'

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
 * SelectMenu class.
 */
export default class SelectMenu {
  /**
   * Constructor for a SelectMenu class.
   * @param {string} name A unique name to refer to this SelectMenu.
   */
  constructor (name) {
    this.name = name

    this.selectmenu = null
    this.rendered = false
    this.keys = {
      legalKeys: ['width', 'height', 'dropDownArrowSrc', 'id', 'renderTarget', 'show'],
      nestedKeys: ['width', 'height']
    }
    this.config = {
      dimensions: {
        width: 280,
        height: 40
      },
      // Currently, the default of the next option throws an error, but later
      // on, it probably will not.
      dropDownArrowSrc: 'default',
      id: null,
      renderTarget: null,
      show: true
    }

    this._createElements()
    this._applyStyles()
  }

  /**
   * Gets the selected value.
   * @returns {string}
   */
  get selected () {
    return this.selectmenu.value
  }

  /**
   * Creates the DOM elements to be manipulated.
   * @private
   */
  _createElements () {
    this.selectmenu = document.createElement('select')
    this.selectmenu.id = `${this.name}-select`

    // Set the ARIA attribute for this select menu.
    this.selectmenu.setAttribute('role', 'listbox')
  }

  /**
   * Applies the required styles to this SelectMenu.
   * @private
   */
  _applyStyles () {
    this.selectmenu.classList.add(
      'ui-content',
      'ui-radius',
      'custom-select',
      'ui-light'
    )
  }

  /**
   * Private ``_render()`` method.
   * @private
   */
  _render () {
    if (this.config.renderTarget instanceof HTMLElement) {
      domHelpers.render(this.selectmenu, this.config.renderTarget)
    } else {
      throw new TypeError(
        'renderTarget must be a HTMLElement to render select menu!'
      )
    }
  }

  /**
   * Sets the dynamic properties of this SelectMenu.
   * @returns {SelectMenu}
   */
  setDynamicProps () {
    this.selectmenu.style.height = `${this.config.dimensions.height}px`
    this.selectmenu.style.width = `${this.config.dimensions.width}px`

    this.selectmenu.style.display = 'block'

    if (this.config.dropDownArrowSrc === 'default') {
      throw new Error('Default of dropDownArrowSrc option is not available!')
    }
    this.selectmenu.style.backgroundImage = `url("${this.config.dropDownArrowSrc}")`
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
    } else if (['width', 'height'].includes(key)) {
      return this.config.dimensions[key]
    } else {
      return this.config[key]
    }
  }

  /**
   * Sets a configuration value. Always re-renders.
   * @param {string} key The key of the configuration.
   * @param {any} val The value to set it to.
   * @returns {SelectMenu}
   */
  set (key, val) {
    if (!this.keys.legalKeys.includes(key)) {
      throw new TypeError(
        'Invalid configuration key!'
      )
    }

    if (this.keys.nestedKeys.includes(key)) {
      // Configuration is nested inside an object.
      // All nested keys expect number values.
      if (typeof val !== 'number') {
        throw new TypeError(
          `Expected val to be type of number, received type ${typeof val}.`
        )
      }

      if (['width', 'height'].includes(key)) {
        this.config.dimensions[key] = val
      }
    } else {
      this.config[key] = val
    }

    if (this.config.renderTarget instanceof HTMLElement) {
      this.render()
    }

    return this
  }

  /**
   * Sets an option for this selectmenu.
   * @param {string} id The ID of the option to modify.
   * @param {OptionConfig} config Configurations for setting the option in the selectmenu.
   */
  setOption (id, config) {
    let option = this.selectmenu.querySelector(`#${id}`)
    if (!option && config.add) {
      // If the option doesn't already exist, the user wants us to add it.
      option = new Option(config.content, config.value, config.selected, config.selected)
      option.id = id
      this.selectmenu.appendChild(option)
      return this
    } else if (option && config.delete) {
      domHelpers.removeChildNode(option, this.selectmenu)
      return this
    } else if (option && config.modify) {
      option.selected = config.selected || option.selected
      option.value = config.value || option.value
      if (typeof config.content === 'string') {
        domHelpers.removeAllChildNodes(option)
        option.appendChild(document.createTextNode(config.content))
      }
      return this
    }
    throw new Error(
      `Failed to set option #${id}, with config ${JSON.stringify(config, null, 2)}`
    )
  }

  /**
   * Hides this SelectMenu.
   */
  hide () {
    this.selectmenu.style.display = 'none'

    this.rendered = false
    return this
  }

  /**
   * Renders this select menu.
   * @returns {SelectMenu}
   */
  render () {
    if (!this.config.show) {
      if (this.rendered) {
        this.hide()
      }
      return this
    } else if (this.rendered) {
      this.setDynamicProps()
      return this
    }
    this.selectmenu.style.display = 'block'

    this.setDynamicProps()
    this._render()
    this.rendered = true
    return this
  }
}
