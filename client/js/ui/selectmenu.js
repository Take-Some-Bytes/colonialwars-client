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
   * @param {string|HTMLSelectElement} [selectorOrElement] The CSS selector to find the selectmenu with,
   * or the HTMLSelectElement to work with.
   */
  constructor (selectorOrElement) {
    this.selectmenu = null
    this.selectmenuOldParent = null

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

    // Selector parameter is optional.
    if (selectorOrElement && typeof selectorOrElement === 'string') {
      this.initWithCssSelector(selectorOrElement)
    } else if (selectorOrElement instanceof HTMLSelectElement) {
      this.initWithSelectElement(selectorOrElement)
    }
  }

  /**
   * Gets the selected value.
   * @returns {string}
   */
  get selected () {
    return this.selectmenu.value
  }

  /**
   * Gets the select element that this class is going to modify. Returns null if the element
   * selected is not a HTML ``<select>`` element, or if none could be found.
   * @param {string} selector The CSS selector to find the selectmenu with.
   * @returns {HTMLSelectElement|null}
   * @private
   */
  _getSelectMenu (selector) {
    const selectmenu = document.querySelector(selector)

    if (!(selectmenu instanceof HTMLSelectElement)) {
      return null
    }

    return selectmenu
  }

  /**
   * Private ``_render()`` method.
   * @private
   */
  _render () {
    if (this.config.renderTarget instanceof HTMLElement) {
      domHelpers.render(this.wrapper, this.config.renderTarget)
    } else {
      throw new TypeError(
        'renderTarget must be a HTMLElement to render select menu!'
      )
    }
  }

  /**
   * Initializes this select menu with the selectmenu retrieved by the specified CSS selector.
   * @param {string} selector The CSS selector to find the selectmenu with.
   * @returns {SelectMenu}
   */
  initWithCssSelector (selector) {
    this.selectmenu = this._getSelectMenu(selector)
    // If the selectmenu was already initialized, skip the rest of the function.
    if (
      this.selectmenu &&
      this.selectmenu.parentElement instanceof HTMLDivElement &&
      this.selectmenu.parentElement.id === `${this.config.id || this.selectmenu.id}-wrapper` &&
      this.selectmenu.parentElement.classList.contains('select-menu-wrapper')
    ) {
      return
    }
    this.config.renderTarget = this.selectmenu.parentElement
    this.wrapper = this.wrapSelect(this.selectmenu, this.config.id || this.selectmenu.id)
    this.applyStyles(this.selectmenu, this.wrapper)
  }

  /**
   * Initializes this SelectMenu with an already existing ``select`` element
   * @param {HTMLSelectElement} elem The HTMLSelectElement to work with.
   */
  initWithSelectElement (elem) {
    if (!(elem instanceof HTMLSelectElement)) {
      throw new TypeError('elem is not a HTMLSelectElement!')
    }

    this.selectmenu = elem
    this.config.renderTarget = this.selectmenu.parentElement
    this.wrapper = this.wrapSelect(this.selectmenu, this.config.id || this.selectmenu.id)
    this.applyStyles(this.selectmenu, this.wrapper)
  }

  /**
   * Sets the dynamic properties of this selectmenu.
   * @param {HTMLSelectElement} selectmenu The ``<select>`` element to apply the styles to.
   * @param {HTMLDivElement} [wrapper] The ``<div>`` element that wraps the selectmenu.
   * @returns {SelectMenu}
   */
  setDynamicProps (selectmenu, wrapper) {
    wrapper.style.height = `${this.config.dimensions.height}px`
    wrapper.style.width = `${this.config.dimensions.width}px`
    selectmenu.style.height = `${this.config.dimensions.height}px`
    selectmenu.style.width = `${this.config.dimensions.width}px`

    wrapper.style.display = 'block'
    selectmenu.style.display = 'block'

    if (this.config.dropDownArrowSrc === 'default') {
      throw new Error('Default of dropDownArrowSrc option is not available!')
    }
    wrapper.style.backgroundImage = `url("${this.config.dropDownArrowSrc}")`
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
   * Wraps a HTML ``<select>`` element with a ``<div>`` element. Guaranteed to
   * return a ``<div>`` element that contains the passed ``<select>`` element.
   * @param {HTMLSelectElement} selectmenu The ``<select>`` element to wrap.
   * @param {string} baseID The base ID for the wrapper ``<div>`` element.
   * @returns {HTMLDivElement}
   */
  wrapSelect (selectmenu, baseID) {
    const wrapper = document.createElement('div')
    wrapper.id = `${baseID}-wrapper`
    wrapper.appendChild(selectmenu)

    return wrapper
  }

  /**
   * Applies the ``selectmenu`` styles to a selectmenu.
   * @param {HTMLSelectElement} selectmenu The ``<select>`` element to apply the styles to.
   * @param {HTMLDivElement} [wrapper] The ``<div>`` element that wraps the selectmenu.
   * @returns {SelectMenu}
   */
  applyStyles (selectmenu, wrapper) {
    if (!(wrapper instanceof HTMLDivElement)) {
      if (!(selectmenu.parentElement instanceof HTMLDivElement)) {
        throw new TypeError(
          'Wrapper div element not found!'
        )
      }
      wrapper = selectmenu.parentElement
    }

    wrapper.classList.add(
      'select-menu-wrapper',
      'ui-content',
      'ui-radius'
    )
    selectmenu.classList.add('select-menu-content')
    return this
  }

  /**
   * Hides this SelectMenu.
   */
  hide () {
    this.wrapper.style.display = 'none'
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
      this.setDynamicProps(this.selectmenu, this.wrapper)
      return this
    }
    this.wrapper.style.display = 'block'
    this.selectmenu.style.display = 'block'

    this.setDynamicProps(this.selectmenu, this.wrapper)
    this._render()
    this.rendered = true
    return this
  }
}
