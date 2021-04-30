/* eslint-env browser */
/**
 * @fileoverview ChunkSplitter class to split a larger map into small chunks.
 */

import debugFactory from '../../debug.js'
import Vector2D from '../physics/vector2d.js'

import * as numberUtils from '../../helpers/number-utils.js'

import { blobToImage } from '../../helpers/image-helpers.js'

const debug = debugFactory('colonialwars:chunk-splitter')

/**
 * @typedef {Object} ChunkSplitterOptions
 * @prop {HTMLCanvasElement} map The canvas element containing the map to be
 * split into chunks.
 * @prop {Vector2D|'calculated'} chunkSize How large each chunk should be.
 * @prop {boolean} prefersBigChunks Whether you prefer big chunks or small chunks.
 *
 * @typedef {Omit<ChunkSplitterOptions, 'map'>} AddChunkOptions
 */

/**
 * ChunkSplitter class.
 */
export default class ChunkSplitter {
  /**
   * ChunkSplitter class to split portions of the game map into smaller chunks.
   * When I say split portions of the game map, I really mean split portions
   * of the canvas that the game map is drawn on.
   * @param {ChunkSplitterOptions} options Options.
   */
  constructor (options) {
    const { prefersBigChunks, chunkSize, map } = options

    this.chunkSize = chunkSize === 'calculated' ? null : chunkSize
    this.calculateChunkSize = chunkSize === 'calculated'
    this.prefersBigChunks = prefersBigChunks
    /**
     * @type {Array<HTMLImageElement>}
     */
    this.chunks = []
    this.loadingChunks = []
    this.workCanvas = document.createElement('canvas')

    this.splitChunks(
      this.calculateChunkSize, this.prefersBigChunks, this.chunkSize, map
    )
  }

  /**
   * Gets the chunk size of the map.
   * @param {import('../../components/custom-modal').Dimensions} dimensions
   * The map dimensions.
   * @param {boolean} prefersBigChunks Whether you prefer big chunks or small chunks.
   * @returns {Vector2D}
   * @private
   */
  _getChunkSize (dimensions, prefersBigChunks) {
    const chunkSize = Vector2D.zero()
    const widthDivisors = numberUtils.findAllDivisors(dimensions.width)
    const heightDivisors = numberUtils.findAllDivisors(dimensions.height)
    let widthDivisor = 0
    let heightDivisor = 0

    // We don't need 1 and the number itself as a divisor.
    widthDivisors.pop()
    heightDivisors.pop()
    widthDivisors.shift()
    heightDivisors.shift()
    // debugger

    if (prefersBigChunks) {
      debug('prefers big chunks')
      // If we want big chunks, use a smaller divisor.
      widthDivisors.splice(0, Math.floor(widthDivisors.length / 2))
      heightDivisors.splice(0, Math.floor(heightDivisors.length / 2))
      // If the map is divisible by 1000, then great! Use 1000x1000 chunks.
      if (dimensions.width % 1000 === 0 && dimensions.height % 1000 === 0) {
        debug('Chunk divisible by 1000')
        chunkSize.add({
          x: dimensions.width % 1000 ? 0 : dimensions.width / (dimensions.width / 1000),
          y: dimensions.height % 1000 ? 0 : dimensions.height / (dimensions.height / 1000)
        })
      }
      // The middle divisor is the one we want.
      widthDivisor = widthDivisors[Math.round(widthDivisors.length / 3 * 2) - 1]
      heightDivisor = heightDivisors[Math.round(heightDivisors.length / 3 * 2) - 1]
      // console.debug(dimensions)
      // console.debug(chunkSize)
      // console.debug(dimensions.width / (dimensions.width / heightDivisor))

      chunkSize.add({
        x: chunkSize.x ? 0 : dimensions.width / (dimensions.width / widthDivisor),
        y: chunkSize.y ? 0 : dimensions.height / (dimensions.height / heightDivisor)
      })
      debug(chunkSize)
    } else {
      debug('prefers small chunks')
      // If we want small chunks, use a bigger divisor.
      widthDivisors.splice(Math.floor(widthDivisors.length / 2))
      heightDivisors.splice(Math.floor(heightDivisors.length / 2))
      // If the map is divisible by 100, then great! Use 100x100 chunks.
      if (dimensions.width % 100 === 0 || dimensions.height % 100 === 0) {
        debug('Chunk divisible by 100')
        chunkSize.add({
          x: dimensions.width % 100 ? 0 : dimensions.width / (dimensions.width / 100),
          y: dimensions.height % 100 ? 0 : dimensions.height / (dimensions.height / 100)
        })
      }
      widthDivisor = widthDivisors[0]
      heightDivisor = heightDivisors[0]

      chunkSize.add({
        x: chunkSize.x ? 0 : dimensions.width / (dimensions.width / widthDivisor),
        y: chunkSize.y ? 0 : dimensions.height / (dimensions.height / heightDivisor)
      })
      debug(chunkSize)
    }

    return Vector2D.floorAxes(chunkSize)
  }

  /**
   * Sets up the canvas this chunk manager is going to work with.
   * @param {Vector2D} chunkSize The size of each chunk.
   * @private
   */
  _setUpWorkCanvas (chunkSize) {
    // Set the canvas size to the chunk size.
    this.workCanvas.width = chunkSize.x
    this.workCanvas.height = chunkSize.y
  }

  /**
   * Adds more chunks to this ChunkSplitter's list of chunks.
   * @param {HTMLCanvasElement} map The canvas element containing the map
   * to split into smaller chunks.
   * @param {AddChunkOptions} options Options.
   */
  addChunks (map, options) {
    if (!options) {
      options = {
        chunkSize: this.chunkSize === null ? 'calculated' : this.chunkSize,
        prefersBigChunks: this.prefersBigChunks
      }
    }
    const calculateChunkSize = options.chunkSize === 'calculated'
    const prefersBigChunks = options.prefersBigChunks
    const chunkSize = options.chunkSize === 'calculated' ? null : options.chunkSize

    this.splitChunks(
      calculateChunkSize, prefersBigChunks, chunkSize, map
    )
  }

  /**
   * Splits a map into smaller chunks.
   * @param {boolean} calculateChunkSize Whether to calculate an optimal chunk size.
   * @param {boolean} prefersBigChunks Whether you prefer big chunks or small chunks.
   * @param {Vector2D|null} chunkSize The size of each chunk.
   * @param {HTMLCanvasElement} map The HTMLCanvasElement the map was drawn on.
   */
  splitChunks (calculateChunkSize, prefersBigChunks, chunkSize, map) {
    console.time('splitChunk')
    if (calculateChunkSize) {
      debug('calculating chunk size')
      chunkSize = this._getChunkSize({
        width: map.width,
        height: map.height
      }, prefersBigChunks)
    }

    const start = Vector2D.zero()
    const end = Vector2D.fromArray([map.width, map.height])
    const ctx = this.workCanvas.getContext('2d')
    const loadingImages = []
    // let i = 0

    this._setUpWorkCanvas(chunkSize)
    debug('set up work canvas')
    // debugger
    debug(end.x / chunkSize.x, end.y / chunkSize.y)
    for (let x = start.x, endX = end.x; x < endX; x += chunkSize.x) {
      for (let y = start.y, endY = end.y; y < endY; y += chunkSize.y) {
        // i++
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.drawImage(
          map, x, y, chunkSize.x, chunkSize.y,
          0, 0, chunkSize.x, chunkSize.y
        )

        loadingImages.push(new Promise(resolve => {
          this.workCanvas.toBlob((blob) => {
            blobToImage(blob).then(resolve)
          })
        }))
      }
    }

    this.loadingChunks.push(...loadingImages)
    debug('Loading chunk number: %d', this.loadingChunks.length)
    // console.debug('split chunk iterations', i)
    this.chunkSize = chunkSize
    console.timeEnd('splitChunk')
  }

  /**
   * Waits until the chunks of this ChunkSplitter are all loaded.
   */
  async finishLoadingChunks () {
    this.chunks.push(...await Promise.all(this.loadingChunks))
    debug(this.chunks.length)
    this.loadingChunks.splice(0)
    // debugger
  }
}
