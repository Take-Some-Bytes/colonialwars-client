/* eslint-env browser */
/**
 * @fileoverview Selectmenu class to control the appearances of the native
 * HTML select menu.
 */

/**
 * SelectMenu class.
 */
export default class SelectMenu {
  /**
   * Constructor for a SelectMenu class.
   * @param {string} selector The CSS selector to find the selectmenu with.
   */
  constructor (selector) {
    this.selectmenu = null
    this.selectmenuOldParent = null

    this.rendered = false
    this.keys = {
      legalKeys: ['width', 'height', 'dropDownArrowSrc', 'id'],
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
      id: null
    }

    this.initSelectMenu(selector)
  }

  /**
   * Gets the select element that this class is going to modify. Returns null if the element
   * selected is not a HTML ``<select>`` element, or if none could be found.
   * @param {string} selector The CSS selector to find the selectmenu with.
   * @returns {HTMLSelectElement|null}
   */
  getSelectMenu (selector) {
    const selectmenu = document.querySelector(selector)

    if (!(selectmenu instanceof HTMLSelectElement)) {
      return null
    }

    return selectmenu
  }

  /**
   * Initializes this select menu.
   * @param {string} selector The CSS selector to find the selectmenu with.
   * @returns {SelectMenu}
   */
  initSelectMenu (selector) {
    this.selectmenu = this.getSelectMenu(selector)
    // If the selectmenu was already initialized, skip the rest of the function.
    if (
      this.selectmenu.parentElement instanceof HTMLDivElement &&
      this.selectmenu.parentElement.id === `${this.config.id || this.selectmenu.id}-wrapper` &&
      this.selectmenu.parentElement.classList.contains('select-menu-wrapper')
    ) {
      return
    }
    this.selectmenuOldParent = this.selectmenu.parentElement
    this.wrapper = this.wrapSelect(this.selectmenu, this.config.id || this.selectmenu.id)
    this.applyStyles(this.selectmenu, this.wrapper)
  }

  /**
   * Applys the ``selectmenu`` styles to a selectmenu.
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
   * Applys the ``selectmenu`` styles to a selectmenu.
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
   * Renders this select menu.
   * @returns {SelectMenu}
   */
  render () {
    if (this.rendered) {
      this.setDynamicProps(this.selectmenu, this.wrapper)
      return this
    }

    this.setDynamicProps(this.selectmenu, this.wrapper)
    this.selectmenuOldParent.appendChild(this.wrapper)
    this.rendered = true
  }
}
