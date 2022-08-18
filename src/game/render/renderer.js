/* eslint-env browser */
/**
 * @fileoverview Renderer class to handle rendering of the game world.
 */

import debugFactory from 'debug'

import { Vector2D, inBound } from 'colonialwars-lib/math'

import split from './splitter.js'

const debug = debugFactory('cw-client:renderer')

/**
 * TODO: Figure out how we want to load assets.
 *
 * Assets are... finicky. We risk wasting too much time if we load them all at
 * once. We also risk attempting to use non-existent sprites if we load them
 * on-demand. Preferably, all rendering should be synchronous.
 * (2022/08/17) Take-Some-Bytes */

/**
 * @callback RenderMapFunc
 * @param {CanvasRenderingContext2D} context The rendering context to use.
 * @param {RenderMapOpts} opts Rendering options.
 * @returns {Promise<void>}
 */
/**
 * @typedef {import('colonialwars-lib/math').Vector2DLike} Vector2DLike
 *
 * @typedef {Object} RenderMapOpts
 * @prop {Vector2DLike} mapStart The position to start taking entities from the
 * map and putting them onto the canvas.
 * @prop {Vector2DLike} mapEnd The position to stop taking entities from the
 * map and putting them onto the canvas.
 *
 * @typedef {Object} RendererOpts
 * @prop {import('../viewport').default} viewport
 * @prop {import('../../apps/play-app').MapData} mapData
 * @prop {import('./graphics-store').default} graphicsStore
 * @prop {CanvasRenderingContext2D} context The canvas context to draw with.
 * @prop {import('../../helpers/display-utils').ViewportDimensions} vwDimensions
 *
 * @typedef {Object} InitOpts
 * @prop {RenderMapFunc} renderMap A function to render the map as it would look
 * within the specified bounds.
 */

/**
 * Renderer class to render the game world.
 */
export default class Renderer {
  /**
   * Constructor for a Renderer class. The Renderer class is responsible
   * for rendering game graphics.
   * @param {RendererOpts} opts Options.
   */
  constructor (opts) {
    this._ctx = opts.context
    this._mapData = opts.mapData
    this._viewport = opts.viewport
    this._vwDimensions = opts.vwDimensions
    this._graphicsStore = opts.graphicsStore

    this._width = opts.context.canvas.width
    this._height = opts.context.canvas.height

    /**
     * Image chunks of the map, to optimize rendering.
     * @type {Array<ImageBitmap>}
     * @private
     */
    this._mapChunks = []
    /** Has the map been chunked yet? */
    this._mapChunked = false
    /** @type {Vector2DLike} */
    this._chunkSize = null
  }

  // ================ Private initialization ================ //

  /**
   * Initializes the map chunks that are going to be drawn.
   *
   * The map is chunked for performance reasons, since drawing hundreds of tiles
   * is less than performant.
   * @param {RenderMapFunc} mapRenderer A function to render the map on a canvas.
   * @private
   */
  async _initMapChunks (mapRenderer) {
    if (this._mapChunked) { return }

    const workCanvas = document.createElement('canvas')
    const workCtx = workCanvas.getContext('2d')

    /**
     * TODO: Handle cases where map size > 15000 pixels.
     * Canvases don't work at that size.
     * (2022/08/17) Take-Some-Bytes */
    await mapRenderer(workCtx, {})

    const res = await split(workCanvas, {
      calculateChunkSize: true
    })

    this._mapChunks = this._mapChunks.concat(res.chunks)
    this._chunkSize = res.chunkSize

    this._mapChunked = true
  }

  // ================ Public initialization ================ //

  /**
   * Initializes this Renderer.
   *
   * This includes the crucial step of chunking the map into "big tiles", which
   * is an optimization to ensure we don't waste CPU time on drawing tiles,
   * obstacles, and decorations which all remain static for the duration of a
   * Renderer's lifetime.
   * @param {InitOpts} opts Required initialization options.
   */
  async init (opts) {
    await this._initMapChunks(opts.renderMap)

    debug('Game renderer initialized')
  }

  // ================ Public rendering ================ //

  /**
   * Clears the canvas.
   */
  clear () {
    this._ctx.clearRect(0, 0, this._width, this._height)
  }

  /**
   * Renders the map onto the canvas.
   * @param {Vector2DLike} playerPos The current position of the player.
   */
  renderMap (playerPos) {
    const chunkSize = this._chunkSize
    const visibleStart = Vector2D.floorAxes(this._viewport.toCanvas(
      Vector2D.sub(playerPos, {
        x: this._vwDimensions.width / 2 + chunkSize.x * 2,
        y: this._vwDimensions.height / 2 + chunkSize.y * 2
      })
    ))
    const visibleEnd = Vector2D.floorAxes(this._viewport.toCanvas(
      Vector2D.add(playerPos, {
        x: this._vwDimensions.width,
        y: this._vwDimensions.height
      })
    ))
    const start = Vector2D.floorAxes(this._viewport.toCanvas({ x: 0, y: 0 }))
    const end = Vector2D.floorAxes(this._viewport.toCanvas({
      x: this._mapData.worldLimits.x,
      y: this._mapData.worldLimits.y
    }))
    let chunkID = 0

    for (
      let x = start.x; x < end.x; x += chunkSize.x
    ) {
      for (
        let y = start.y; y < end.y; y += chunkSize.y
      ) {
        if (
          inBound(x, visibleStart.x, visibleEnd.x) &&
          inBound(y, visibleStart.y, visibleEnd.y)
        ) {
          this._ctx.drawImage(
            this._mapChunks[chunkID], x, y
          )
        }

        chunkID++
      }
    }
  }
}
