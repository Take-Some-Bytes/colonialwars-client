/* eslint-env browser */

import debugFactory from 'debug'

import { findAllDivisors } from '../../helpers/number-utils'

const debug = debugFactory('cw-client:splitter')

/**
 * @typedef {import('../physics/vector2d').Vector2DLike} Vector2DLike
 * @typedef {Record<'width'|'height', number>} Dimensions
 *
 * @typedef {Object} SplitOpts
 * @prop {boolean} [calculateChunkSize] Whether to calculate the size of each chunk.
 * @prop {Vector2DLike} [chunkSize] The size of each chunk if ``calculateChunkSize``
 * is false.
 *
 * @typedef {Object} SplitResult
 * @prop {Vector2DLike} chunkSize
 * @prop {Array<ImageBitmap>} chunks
 */

/**
 * Calculates the optimal chunk size for an image.
 * @param {Dimensions} dimensions The dimensions of the image.
 * @returns {Vector2DLike}
 */
function calculateChunkSize (dimensions) {
  // If the image is divisible by 1000, then great! Use 1000x1000 chunks.
  if (dimensions.width % 1000 === 0 && dimensions.height % 1000 === 0) {
    debug('Image divisible by 1000; Using 1000x1000 chunks')

    return {
      x: 1000,
      y: 1000
    }
  }

  const widthDivisors = findAllDivisors(dimensions.width)
  const heightDivisors = findAllDivisors(dimensions.height)

  // We don't need 1 and the number itself as a divisor.
  widthDivisors.pop()
  heightDivisors.pop()
  widthDivisors.shift()
  heightDivisors.shift()

  // Get a small divisor, because that means we get bigger chunks.
  widthDivisors.splice(Math.floor(widthDivisors.length / 2))
  heightDivisors.splice(Math.floor(heightDivisors.length / 2))

  debug('Possible width divisors: %O', widthDivisors)
  debug('Possible height divisors: %O', heightDivisors)

  return {
    // Lean towards the first third of divisors.
    x: dimensions.width / widthDivisors[Math.round(widthDivisors.length / 3) - 1],
    y: dimensions.height / heightDivisors[Math.round(widthDivisors.length / 3) - 1]
  }
}

/**
 * Utility function to split an image into chunks.
 *
 * This is most useful for tiles, where drawing individual tiles is too
 * CPU-consuming, but mashing everything into a giant tile isn't really ideal.
 *
 * Returns an promise that resolves to an object, which contains the size of each
 * chunk and the chunks themselves.
 * @param {CanvasImageSource} img The image to split into chunks.
 * @param {SplitOpts} opts Required options.
 * @returns {Promise<SplitResult>}
 */
export default function split (img, opts) {
  console.time('split chunk')

  const chunkSize = opts.calculateChunkSize
    ? calculateChunkSize({ width: img.width, height: img.height })
    : opts.chunkSize

  debug('Chunk size "%o" was chosen', chunkSize)

  const start = { x: 0, y: 0 }
  const end = {
    x: img.width,
    y: img.height
  }

  const loadingChunks = []

  for (let x = start.x; x < end.x; x += chunkSize.x) {
    for (let y = start.y; y < end.y; y += chunkSize.y) {
      // Chunk the image using the specified chunk size.
      loadingChunks.push(createImageBitmap(
        img, x, y, chunkSize.x, chunkSize.y
      ))
    }
  }

  debug('Loading %d chunks', loadingChunks.length)

  return Promise.all(loadingChunks).then(chunks => {
    console.timeEnd('split chunk')

    return { chunks, chunkSize }
  })
}
