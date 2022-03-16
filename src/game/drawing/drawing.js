/* eslint-env browser */
/**
 * @fileoverview Drawing class to handle game drawing.
 */

import constants from '../../constants.js'
import MapDrawer from './map-drawer.js'
import debugFactory from 'debug'

import { ImageLoader } from '../../helpers/image-helpers.js'

const debug = debugFactory('cw-client:game-drawing')

/**
 * @typedef {Object} DrawingOptions
 * @prop {CanvasRenderingContext2D} context The canvas context to draw with.
 * @prop {import('../viewport').default} viewport
 * @prop {import('../../helpers/image-helpers').ImageLoader} imgLoader
 * @prop {import('./map-drawer').default} mapDrawer Map drawer class to handle
 * drawing the game map.
 * @prop {'grass'|'sand'} mapTheme
 * @prop {import('../../helpers/display-utils').ViewportDimensions} viewportDimensions
 */

/**
 * Drawing class.
 */
export default class Drawing {
  /**
   * Constructor for a Drawing class. The Drawing class is responsible
   * for drawing game graphics.
   * @param {DrawingOptions} opts Options.
   */
  constructor (opts) {
    const {
      context, viewport, imgLoader, mapDrawer, mapTheme, viewportDimensions
    } = opts

    this.ctx = context
    // this.viewport = viewport
    // this.mapTheme = mapTheme
    // this.imgLoader = imgLoader
    this.mapDrawer = mapDrawer
    this.viewportDimensions = viewportDimensions

    this.width = context.canvas.width
    this.height = context.canvas.height
  }

  /**
   * Initializes thie drawing instance.
   */
  async init () {
    await this.mapDrawer.init()
  }

  /**
   * Clears the drawing canvas.
   */
  clear () {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  // /**
  //  * Gets the chunks we need. This uses ChunkSplitter to draw
  //  * @private
  //  */
  // async _getChunks () {
  //   const biomeSheet = await this.imgLoader.loadImg(`${this.mapTheme}-sheet.png`)
  //   // The tile is always 100x100, and it's always in the top left corner.
  // }

  /**
   * Draws the map onto the canvas.
   * @param {import('../physics/vector2d').default} playerPos The player's current position.
   */
  drawMap (playerPos) {
    this.mapDrawer.drawTiles(playerPos, this.viewportDimensions)
  }

  /**
   * Factory method for creating a Drawing class. This is asynchronous since
   * the initialization of the Drawing class is asynchronous.
   * @param {CanvasRenderingContext2D} ctx The canvas context to draw on.
   * @param {import('./map-drawer').MapConfig} mapConfig The map's configurations.
   * @param {import('../viewport').default} viewport The viewport object to translate
   * game coordinates to canvas coordinates.
   * @param {import('../../helpers/display-utils').ViewportDimensions} vwDimensions
   * The ViewportDimensions object for getting the current viewport dimensions.
   * @returns {Promise<Drawing>}
   */
  static async create (ctx, mapConfig, viewport, vwDimensions) {
    const absGameImgDir = `${window.location.origin}${constants.IMG_CONSTANTS.GAME_IMAGE_DIR}/`
    debug(absGameImgDir)
    const imgLoader = new ImageLoader({
      baseURL: absGameImgDir
    })
    const mapDrawer = new MapDrawer({
      gameCanvasContext: ctx,
      imgLoader: imgLoader,
      mapConfig: mapConfig,
      viewport: viewport
    })
    const drawing = new Drawing({
      context: ctx,
      // imgLoader: imgLoader,
      mapDrawer: mapDrawer,
      viewportDimensions: vwDimensions
    })
    await drawing.init()

    return drawing
  }
}
