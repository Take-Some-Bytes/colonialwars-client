/* eslint-env browser */
/**
 * @fileoverview Functions to help the with DOM manipulation
 */

import { bound } from 'colonialwars-lib/math'

/**
 * @typedef {Object} Bounds
 * @prop {Object} x
 * @prop {number} x.min
 * @prop {number} x.max
 * @prop {Object} y
 * @prop {number} y.min
 * @prop {number} y.max
 *
 * @typedef {Object} DraggableHandle
 * @prop {() => void} undrag
 */

/**
 * Removes all child nodes of a parent node.
 * @param {Element} elem The element to remove the nodes from.
 */
export function removeAllChildNodes (elem) {
  while (elem.firstChild) {
    elem.removeChild(elem.lastChild)
  }
}
/**
 * Makes an element draggable. Returns true if the element has been made draggable.
 * @param {HTMLElement} elem The element to make draggable.
 * @param {string} draggableID The element that the user has to actually
 * drag to move the element.
 * @param {Bounds} bounds The bounds of the draggable element.
 * @returns {DraggableHandle}
 */
export function makeDraggable (elem, draggableID, bounds) {
  /**
   * XXX: The onMouseMove function below causes layout thrashing.
   * Does it need to be fixed?
   * (08/28/2021) Take-Some-Bytes */
  let toMoveX = 0
  let toMoveY = 0
  let clientPosX = 0
  let clientPosY = 0
  /**
   * @param {MouseEvent} e
   */
  function onMouseMove (e) {
    e && e.preventDefault()
    // Get the element dimensions.
    const elemOffset = {
      top: elem.offsetTop,
      left: elem.offsetLeft
    }
    const elemDimensions = {
      height: elem.clientHeight,
      width: elem.clientWidth
    }

    // Calculate the new cursor position:
    toMoveX = clientPosX - e.clientX
    toMoveY = clientPosY - e.clientY
    clientPosX = e.clientX
    clientPosY = e.clientY
    // Set the element's new position:
    elem.style.top = bound(
      (elemOffset.top - toMoveY), bounds.y.min,
      bounds.y.max - parseInt(
        elemDimensions.height, 10
      )
    ) + 'px'
    elem.style.left = bound(
      (elemOffset.left - toMoveX), bounds.x.min,
      bounds.x.max - parseInt(
        elemDimensions.width, 10
      )
    ) + 'px'
  }
  /**
   * @param {MouseEvent} e
   */
  function onMouseUp (e) {
    e && e.preventDefault()
    document.removeEventListener('mouseup', onMouseUp)
    document.removeEventListener('mousemove', onMouseMove)
  }
  /**
   * @param {MouseEvent} e
   */
  function onMouseDown (e) {
    e && e.preventDefault()
    clientPosX = e.clientX
    clientPosY = e.clientY

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const elemHeader = document.querySelector(`#${elem.id}-header`)
  const draggableElem = document.querySelector(`#${draggableID}`)
  if (elemHeader) {
    elemHeader.addEventListener('mousedown', onMouseDown)
    return {
      undrag: () => {
        elemHeader.removeEventListener('mousedown', onMouseDown)
      }
    }
  } else if (draggableElem) {
    draggableElem.addEventListener('mousedown', onMouseDown)
    return {
      undrag: () => {
        draggableElem.removeEventListener('mousedown', onMouseDown)
      }
    }
  }
  return { undrag: () => { /* no-op */ } }
}
