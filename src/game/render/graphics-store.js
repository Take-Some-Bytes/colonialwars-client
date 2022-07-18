/* eslint-env browser */
/**
 * @fileoverview A class to handle loading graphics and animations.
 */

import { ImageSlicer } from '../../helpers/image-helpers.js'

/**
 * @typedef {import('../../apps/play-app').Graphic} Graphic
 * @typedef {'mainImg'|'damaged1Img'|'damaged2Img'|'constructing1Img'} ImgType
 * @typedef {import('../../apps/play-app').DynAnimationKeys} AnimationType
 *
 * @typedef {Object} AnimationHandle
 * @prop {number} numFrames The number of frames in this animation.
 * @prop {(frame: number) => Promise<ImageBitmap>} frame Gets the specified
 * frame of this animation. Throws an error if the frame ID is out of bounds.
 *
 * @typedef {Object} GraphicHandle A handle to a graphic.
 * @prop {number} angles The number of angles this graphic has.
 * @prop {(img: ImgType) => Promise<ImageBitmap|null>} image Gets the
 * specified image, or null if this graphic doesn't have it.
 * @prop {(animation: AnimationType) => AnimationHandle|null} animation
 * Gets a handle to the specified animation if it exists.
 *
 * @typedef {Object} CreateAnimationOpts
 * @prop {ImageSlicer} slicer
 *
 * @typedef {Object} GraphicsStoreOpts
 * @prop {import('../../helpers/image-helpers').ImageLoader} imgLoader The image
 * loader to use.
 * @prop {Record<string, Graphic>} graphicsData All the metadata about
 * all the graphics.
 */

/**
 * A class to handle loading graphics and animations.
 */
export default class GraphicsStore {
  /**
   * Creates a new GraphicsStore.
   *
   * This class mainly handles validation of graphics data sent from the server,
   * and fulfulling requests for graphics lazily.
   * @param {GraphicsStoreOpts} opts Required options.
   */
  constructor (opts) {
    this._imgLoader = opts.imgLoader
    this._graphicsData = opts.graphicsData
  }

  /**
   * Loads the underlying file of the specified graphic.
   * @param {string} graphic The ID of the graphic.
   * @returns {Promise<HTMLImageElement>}
   * @private
   */
  _loadFileOf (graphic) {
    const file = this._graphicsData[graphic].file

    return this._imgLoader.loadImg(file)
  }

  /**
   * Creates an animation handle.
   * @param {import('../../apps/play-app').DynAnimation} animation The animation
   * to create a handle for.
   * @param {CreateAnimationOpts} opts Required options.
   * @returns {AnimationHandle}
   * @private
   */
  _createAnimationHandle (animation, opts) {
    const numFrames = animation.w / animation.frameSize
    return {
      numFrames,
      frame: frameId => {
        if (frameId < 0 || frameId > numFrames) {
          throw new RangeError('Frame ID out of bounds!')
        }

        return opts.slicer.slice(
          animation.x, animation.y, animation.w, animation.h
        )
      }
    }
  }

  /**
   * Gets the graphic with the specified ID.
   *
   * The returned value is either an object with methods to load individual
   * images and animations, or null if the graphic doesn't exist.
   * @param {string} id The ID of the graphic.
   * @returns {Promise<GraphicHandle|null>}
   */
  async getGraphic (id) {
    if (!(id in this._graphicsData)) {
      return null
    }

    const file = await this._loadFileOf(id)
    const slicer = new ImageSlicer(file)
    const graphic = this._graphicsData[id]

    return {
      angles: this._graphicsData[id].angles,
      image: img => {
        const staticImg = graphic[img]
        if (!staticImg) {
          return null
        }
        if (staticImg.w === 0 || staticImg.h === 0) {
          // Zero-height and zero-width images make no sense.
          return null
        }

        return slicer.slice(staticImg.x, staticImg.y, staticImg.w, staticImg.h)
      },
      animation: anim => {
        if (!graphic.hasAnimations) {
          return null
        }

        const animation = graphic.animations[anim]
        if (!animation) {
          return null
        }
        if (animation.w === 0 || animation.h === 0) {
          // Zero-height and zero-width animations make no sense.
          return null
        }

        return this._createAnimationHandle(animation, { slicer })
      }
    }
  }
}
