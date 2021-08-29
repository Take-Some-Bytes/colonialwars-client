/* eslint-env browser */
/**
 * @fileoverview Selectmenu class to control the appearance of the native
 * HTML select menu.
 */

import { removeAllChildNodes } from '../helpers/dom-helpers.js'

/**
 * @typedef {'width'|'height'|'dropDownArrowSrc'|'show'} SelectmenuConfigKeys
 *
 * @typedef {Object} SelectmenuOption
 * @prop {boolean} selected
 * @prop {boolean} disabled
 * @prop {string} content
 * @prop {string} value
 *
 * @typedef {Object} RenderedOption
 * @prop {HTMLOptionElement} option
 * @prop {boolean} selected
 * @prop {boolean} disabled
 * @prop {string} content
 * @prop {string} value
 */

// An array of the names of functions of a ``Map`` that modify the ``Map``.
const MAP_MODIFING_KEYS = [
  'set', 'clear', 'delete'
]

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

    /**
     * A cache of the last rendered buttons.
     * @type {Record<string, RenderedOption>}
     */
    this._lastRenderedOptions = {}

    /**
     * A map of the options this selectmenu has.
     * @type {Map<string, SelectmenuOption>}
     */
    this._options = new Map()
    this._needsUpdate = false
    this._config = {
      dimensions: {
        width: 200,
        height: 40
      },
      dropDownArrowSrc: 'default',
      show: true
    }
  }

  /**
   * Renders all configured options onto the specified select element.
   * @param {HTMLSelectElement} selectElem The parent select element.
   * @private
   */
  _renderOptions (selectElem) {
    for (const [name, config] of this._options.entries()) {
      const rendered = this._lastRenderedOptions[name]
      if (!rendered) {
        // Hasn't been rendered before. Render it.
        const option = document.createElement('option')
        const optionTxt = document.createTextNode(config.content)

        option.appendChild(optionTxt)

        option.selected = config.selected
        option.disabled = config.disabled
        option.value = config.value
        selectElem.appendChild(option)

        // Cache the rendered button.
        this._lastRenderedOptions[name] = {
          option: option.cloneNode(true),
          selected: config.selected,
          disabled: config.disabled,
          content: config.content,
          value: config.value
        }
        continue
      }

      // Button has been rendered.
      // Replace old configurations.
      rendered.selected = config.selected
      rendered.disabled = config.disabled
      rendered.value = config.value
      selectElem.appendChild(rendered.option)

      rendered.option = rendered.option.cloneNode(true)
    }
  }

  /**
   * Gets the selected value.
   * @returns {string}
   */
  get selected () {
    return this._select.value
  }

  /**
   * A map of options to render, and their respective options.
   * @type {Map<string, SelectmenuOption>}
   */
  get options () {
    const self = this

    // Capture calls to modify the options map so we know we have to re-render.
    return new Proxy(this._options, {
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
   * Get the value of a configuration.
   * @param {SelectmenuConfigKeys} key The key of the configuration.
   * @returns {any}
   */
  get (key) {
    if (!Selectmenu.CONFIG_KEYS.legalKeys.includes(key)) {
      throw new Error('Configuration does not exist!')
    } else if (['width', 'height'].includes(key)) {
      return this._config.dimensions[key]
    } else {
      return this._config[key]
    }
  }

  /**
   * Sets a configuration to the specified value.
   * @param {SelectmenuConfigKeys} key The key of the configuration.
   * @param {any} val The value to set the configuration as.
   * @returns {Selectmenu}
   */
  set (key, val) {
    if (!Selectmenu.CONFIG_KEYS.legalKeys.includes(key)) {
      throw new TypeError('Invalid configuration key!')
    }

    if (Selectmenu.CONFIG_KEYS.nestedKeys.includes(key)) {
      // Actual configuration is nested inside other objects,
      // so it receives special treatment.
      // Also, all nested keys expect number values.
      if (typeof val !== 'number') {
        throw new TypeError(
          `Expected val to be type of number. Received type ${typeof val}.`
        )
      }

      this._config.dimensions[key] = val
    } else {
      this._config[key] = val
    }

    this._needsUpdate = true

    return this
  }

  /**
   * Updates this Selectmenu.
   * @returns {Selectmenu}
   */
  update () {
    if (!this._needsUpdate) {
      // Doesn't need update.
      return
    }

    // 1: set select element width and drop down arrow.
    const select = this._select
    select.style.display = this._config.show
      ? 'block'
      : 'none'
    select.style.width = `${this._config.dimensions.width}px`
    select.style.height = `${this._config.dimensions.height}px`
    select.style.backgroundImage = `url("${this._config.dropDownArrowSrc}")`

    // 2: re-render options.
    removeAllChildNodes(select)
    this._renderOptions(this._select)
  }

  // /**
  //  * Sets an option for this selectmenu.
  //  * @param {string} id The ID of the option to modify.
  //  * @param {OptionConfig} config Configurations for setting the option in the selectmenu.
  //  */
  // setOption (id, config) {
  //   let option = this._select.querySelector(`#${id}`)
  //   if (!option && config.add) {
  //     // If the option doesn't already exist, the user wants us to add it.
  //     option = new Option(config.content, config.value, config.selected, config.selected)
  //     option.id = id
  //     this._select.appendChild(option)
  //     return this
  //   } else if (option && config.delete) {
  //     this._select.removeChild(option)
  //     return this
  //   } else if (option && config.modify) {
  //     option.selected = config.selected || option.selected
  //     option.value = config.value || option.value
  //     if (typeof config.content === 'string') {
  //       removeAllChildNodes(option)
  //       option.appendChild(document.createTextNode(config.content))
  //     }
  //     return this
  //   }
  //   throw new Error(
  //     `Failed to set option #${id}, with config ${JSON.stringify(config, null, 2)}`
  //   )
  // }

  // /**
  //  * Disables the option with ID ``id``. Returns true if successful, false
  //  * otherwise.
  //  * @param {string} id The ID of the option to disable.
  //  * @returns {boolean}
  //  */
  // disableOption (id) {
  //   const option = this._select.querySelector(`#${id}`)
  //   if (!(option instanceof HTMLOptionElement)) {
  //     // Option doesn't exist.
  //     return false
  //   }

  //   option.disabled = true
  //   return true
  // }
}
Selectmenu.CONFIG_KEYS = {
  legalKeys: ['width', 'height', 'dropDownArrowSrc', 'show'],
  nestedKeys: ['width', 'height']
}
