/* eslint-env browser */
/**
 * @fileoverview Helper functions and classes for messing with images.
 */

import debugFactory from 'debug'

const debug = debugFactory('cw-client:image-helpers')

/**
 * @typedef {Object} ImageLoaderOptions
 * @prop {string} baseURL The URL to load images relative from.
 *
 * @typedef {Object} SliceOpts
 * @prop {boolean} [force] Whether to force the image slice.
 */

/**
 * Converts a Blob object to a HTMLImageElement.
 * @param {Blob} blob The Blob object ot convert.
 * @returns {Promise<HTMLImageElement>}
 */
export function blobToImage (blob) {
  return new Promise((resolve, reject) => {
    if (!(blob instanceof Blob)) {
      reject(new TypeError('The blob parameter must be a valid blob!'))
    }
    const objURL = URL.createObjectURL(blob)
    const img = new Image()
    img.addEventListener('load', () => {
      URL.revokeObjectURL(objURL)
      resolve(img)
    })
    img.addEventListener('error', e => {
      reject(e)
    })
    img.src = objURL
  })
}

/**
 * ImageLoader class.
 */
export class ImageLoader {
  /**
   * Constructor for an image loader class. The image loader class loads
   * images, storing them in an internal cache.
   * @param {ImageLoaderOptions} opts Options.
   */
  constructor (opts) {
    const { baseURL } = opts

    this.baseURL = baseURL

    /**
     * The internal cache of images that has been loaded.
     * @type {Map<string, InstanceType<Image>>}
     */
    this._imgCache = new Map()

    /**
     * A map of images that are currently being loaded.
     * @type {Map<string, Promise<HTMLImageElement>>}
     */
    this._loadingImgs = new Map()
  }

  /**
   * Loads an image. Uses a cached image if it exists.
   * @param {string} path The path of the image, relative to this ImageLoader's
   * baseURL property.
   * @param {boolean} [force=false] Whether to force the load. If true, this method
   * will not try to find the image in this ImageLoader's image cache. Default false.
   * @returns {Promise<HTMLImageElement>}
   */
  loadImg (path, force = false) {
    debug('Fetching image from path %s', path)

    if (this._imgCache.has(path) && !force) {
      debug('Image fetched from cache.')
      return Promise.resolve(this._imgCache.get(path))
    } else if (this._loadingImgs.has(path)) {
      debug('Image already loading.')
      return this._loadingImgs.get(path)
    }

    const promise = new Promise((resolve, reject) => {
      const img = new Image()
      const imgPath = new URL(path, this.baseURL).pathname
      debug('Absolute image path: %s', imgPath)

      img.src = imgPath

      img.addEventListener('error', e => {
        e.preventDefault()
        reject(new Error(e.error))
      })
      img.addEventListener('load', () => {
        this._imgCache.set(path, img)
        resolve(img)
      })
    })

    // Put the promise in the _loadingImgs map so that if the same
    // image was requested while it was already loading, we won't duplicate
    // our image requests.
    this._loadingImgs.set(path, promise)

    return promise
  }
}

/**
 * ImageSlicer class to help with slicing images.
 */
export class ImageSlicer {
  /**
   * Creates a new ImageSlicer for the specified image.
   *
   * Besides slicing images, this class also caches sliced images so work isn't
   * repeated.
   * @param {HTMLImageElement} image The image to operate on.
   */
  constructor (image) {
    this.image = image

    /**
     * A cache of all the images we've sliced so far.
     * @type {Map<string, ImageBitmap>}
     */
    this._sliceCache = new Map()

    /**
     * A map of all the slices that are currently loading.
     * @type {Map<string, Promise<ImageBitmap>>}
     */
    this._loadingSlices = new Map()
  }

  /**
   * Slices the image, starting and ending at the specified coordinates.
   *
   * If ``opts.force`` is true, will slice the image again even if it's already
   * been sliced and cached.
   *
   * Returns an ``ImageBitmap`` of the sliced image.
   * @param {number} startX The starting X position.
   * @param {number} startY The starting Y position.
   * @param {number} width The width of the slice
   * @param {number} height The height of the slice.
   * @param {SliceOpts} [opts={}] Optional options.
   * @returns {Promise<ImageBitmap>}
   */
  slice (startX, startY, width, height, opts = {}) {
    const sliceId = `${startX}${startY}${width}${height}`

    if (this._sliceCache.has(sliceId) && !opts.force) {
      return Promise.resolve(this._sliceCache.get(sliceId))
    } else if (this._loadingSlices.has(sliceId)) {
      return this._loadingSlices.get(sliceId)
    }

    debug('Slicing image %o with opts: %o', this.image, {
      startX, startY, width, height
    })

    const promise = (async () => {
      const res = await createImageBitmap(
        this.image, startX, startY, width, height
      )

      // Put the loaded slice into the cache, and
      // mark this slice as not loading anymore.
      this._sliceCache.set(sliceId, res)
      this._loadingSlices.delete(sliceId)

      return res
    })()

    this._loadingSlices.set(sliceId, promise)

    return promise
  }
}
