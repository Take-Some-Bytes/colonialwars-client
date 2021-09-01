/* eslint-env browser */
/**
 * @fileoverview Client-side constants.
 */

/**
 * @typedef {Object} ClientConstants
 * @prop {string} VERSION
 * @prop {Object} IMG_CONSTANTS
 * @prop {string} IMG_CONSTANTS.GAME_IMAGE_DIR
 */

/**
  * Deep-freezes an object.
  * @param {O} object The object to deep freeze.
  * @returns {Readonly<O>}
  * @template O
  */
function deepFreeze (object) {
  // Retrieve the property names defined on object.
  const propNames = Object.getOwnPropertyNames(object)
  // Freeze properties before freezing self.
  for (const name of propNames) {
    const value = object[name]
    if (value && typeof value === 'object') {
      deepFreeze(value)
    }
  }
  return Object.freeze(object)
}

const constants = deepFreeze({
  VERSION: 'v0.5.2-PRE-ALPHA',
  RELEASE_STAGE: 'pre-alpha',
  IMG_CONSTANTS: {
    GAME_IMAGE_DIR: '/imgs/game'
  },
  GAME_CONSTANTS: {
    VIEWPORT_STICKINESS: 0.004,
    DRAWING_TILE_SIZE: 100,
    DEFAULT_KEY_BINDINGS: {
      directionBindings: {
        up: ['w', 'W', 'Up', 'ArrowUp'],
        down: ['s', 'S', 'Down', 'ArrowDown'],
        left: ['a', 'A', 'Left', 'ArrowLeft'],
        right: ['d', 'D', 'Right', 'ArrowRight']
      }
    }
  },
  COMMUNICATIONS: {
    CONN_READY: 'ready',
    CONN_UPDATE: 'update',
    CONN_READY_ACK: 'ready-ack',
    CONN_CLIENT_ACTION: 'client-action'
  },
  APP_PAGES: {
    UNSET: Symbol('UNSET'),
    LOBBY: Symbol('LOBBY'),
    PLAY: Symbol('PLAY')
  },
  PLAY_DIALOG_STATES: {
    SERVER_PICKER: Symbol('SERVER_PICKER'),
    GAME_PICKER: Symbol('GAME_PICKER')
  },
  ROOT_FONT_SIZE: parseInt(window.getComputedStyle(document.body).fontSize, 10)
})

export default constants
