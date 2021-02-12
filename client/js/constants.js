/* eslint-env browser */
/**
 * @fileoverview Client-side constants.
 */

/**
 * @typedef {Object} ClientConstants
 * @prop {number} VIEWPORT_WIDTH
 * @prop {number} VIEWPORT_HEIGHT
 * @prop {string} VERSION
 */

/**
 * Gets client constants.
 * @returns {ClientConstants}
 */
export function getConstants () {
  const viewportStats = calculateViewportstats()
  return {
    VIEWPORT_HEIGHT: viewportStats.height,
    VIEWPORT_WIDTH: viewportStats.width,
    VERSION: 'v0.3.0-PRE-ALPHA'
  }
}

/**
 * Calculate viewport stats.
 * @returns {import("./ui/dialog").ViewportStats}
 */
export function calculateViewportstats () {
  return {
    width: (() => {
      if (window.innerWidth !== undefined) {
        const vw = window.innerWidth
        return vw
      }
      const vw = document.documentElement.clientWidth
      return vw
    })(),
    height: (() => {
      if (window.innerHeight !== undefined) {
        const vw = window.innerHeight
        return vw
      }
      const vw = document.documentElement.clientHeight
      return vw
    })()
  }
}
