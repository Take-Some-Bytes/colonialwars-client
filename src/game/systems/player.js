/* eslint-env browser */
/**
 * @fileoverview Player entity systems.
 */

import debugFactory from 'debug'

import Vector2D from '../physics/vector2d.js'

const debug = debugFactory('cw-client:systems:player')

/**
 * @typedef {import('../physics/vector2d').Vector2DLike} Vector2DLike
 * @typedef {import('colonialwars-lib/ecs')} World
 * @typedef {number} EntityType
 *
 * @typedef {Object} ProcessInputsOpts
 * @prop {World} world
 * @prop {number} currentTime
 * @prop {EntityType} playerId
 * @prop {Vector2DLike} worldLimits
 *
 * @typedef {Object} GetVelocityOpts
 * @prop {number} speed
 *
 * @typedef {Object} CreateSelfOpts
 * @prop {string} id
 * @prop {string} name
 * @prop {string} team
 * @prop {number} mass
 * @prop {number} speed
 * @prop {Vector2DLike} position
 *
 * @typedef {Object} AcceptStateOpts
 * @prop {World} world
 * @prop {EntityType} playerId
 * @prop {Vector2DLike} worldLimits
 */

/**
 * Gets the velocity of this player with the given input.
 * @param {PlayerInput} data The input data.
 * @param {GetVelocityOpts} opts Required options.
 * @returns {InstanceType<Vector2D>}
 * @private
 */
function _getVelocity (data, opts) {
  const directionData = data.direction
  const velocity = Vector2D.zero()

  if (directionData.up) {
    velocity.add({ x: 0, y: -opts.speed })
  } else if (directionData.down) {
    velocity.add({ x: 0, y: opts.speed })
  }

  if (directionData.left) {
    velocity.add({ x: -opts.speed, y: 0 })
  } else if (directionData.right) {
    velocity.add({ x: opts.speed, y: 0 })
  }

  return velocity
}

/**
 * Creates the client's own entity in the specified ECS world.
 * @param {World} world The ECS world to create the client's entity in.
 * @param {CreateSelfOpts} opts Required options.
 * @returns {EntityType}
 */
export function createSelf (world, opts) {
  const entity = world.create()

  world.addComponent('physicalProps', {
    to: entity,
    opts: {
      mass: opts.mass,
      speed: opts.speed
    }
  })
  world.addComponent('transform2d', {
    to: entity,
    opts: {
      position: opts.position
    }
  })
  world.addComponent('player', {
    to: entity,
    opts: {
      id: opts.id,
      name: opts.name,
      team: opts.team
    }
  })

  world.addComponent('velocity2d', {
    to: entity
  })

  return entity
}

/**
 * Processes all the inputs of *one* player entity in the ECS world.
 * @param {Array<any>} inputs The inputs to process.
 * @param {World} world The ECS world to process the inputs in.
 * @param {ProcessInputsOpts} opts Required options.
 */
export function processInputs (inputs, opts) {
  const world = opts.world
  const entity = opts.playerId

  /** @type {import('../components/player')} */
  const player = world.getComponent('player', { from: entity })
  const velocity = world.getComponent('velocity2d', { from: entity })
  const transform = world.getComponent('transform2d', { from: entity })
  const props = world.getComponent('physicalProps', { from: entity })

  if (inputs.length < 1) {
    // There are no input changes.
    // Continue doing what we did last time.
    const deltaTime = opts.currentTime - player.lastUpdateTime

    transform.position.add(Vector2D.floorAxes(Vector2D.scale(velocity.velocity, deltaTime)))
    transform.position.boundTo(opts.worldLimits)
    player.lastUpdateTime = opts.currentTime
    return
  }

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]

    if (input.inputNum <= player.lastProcessedInput) {
      // Input sequence number is smaller than last processed input,
      // number, so we gotta skip it.
      debug(
        'Received invalid input sequence number! ' +
          'Last received input: #%d, invalid input: #%d',
        player.lastProcessedInput, input.inputNum
      )
      continue
    } else if (input.timestamp < player.lastUpdateTime) {
      // Input happened earlier than the occurance of the last update,
      // which should not happen. SKIP!
      debug(
        'Received invalid input timestamp! ' +
          'Timestamp records an earlier time than last update time.'
      )
      continue
    }

    velocity.velocity = _getVelocity(input, { speed: props.speed })

    const deltaTime = input.timestamp - player.lastUpdateTime
    player.lastUpdateTime = input.timestamp

    transform.position.add(Vector2D.floorAxes(Vector2D.scale(velocity.velocity, deltaTime)))
    transform.position.boundTo(opts.worldLimits)

    player.lastProcessedInput = input.inputNum
  }
}

/**
 * Accepts the authoritative state for the specified player and entities in the
 * ECS world.
 * @param {import('../game').GameState} state The new authoritative game state.
 * @param {AcceptStateOpts} opts Required options.
 */
export function acceptAuthoritativeState (state, opts) {
  const world = opts.world
  const entity = opts.playerId

  const player = world.getComponent('player', { from: entity })
  const velocity = world.getComponent('velocity2d', { from: entity })
  const transform = world.getComponent('transform2d', { from: entity })

  transform.position = Vector2D.fromObject(state.self.position)
  velocity.velocity = Vector2D.fromObject(state.self.velocity)

  const unprocessedInputs = player.unprocessedInputs.splice(0)
  const stillUnprocessed = unprocessedInputs.filter(pending => {
    if (pending.inputNum <= state.lastProcessedInput) {
      // Already processed. Its effect is already taken into account into the world update
      // we just got, so we can forget about it
      player.lastInputProcessTime = pending.timestamp
      return false
    }

    return true
  })

  if (stillUnprocessed.length > 0) {
    processInputs(stillUnprocessed, {
      world: opts.world,
      playerId: opts.playerId,
      // We don't care about the current time, because we KNOW there's
      // still inputs to be processed.
      currentTime: null,
      worldLimits: opts.worldLimits
    })

    player.unprocessedInputs.push(...stillUnprocessed)
  }
}
