/* eslint-env browser */
/**
 * @fileoverview Functions to help the with DOM manipulation
 */

import { bind } from './number-utils.js'

/**
 * @typedef {Object} Bounds
 * @prop {Object} x
 * @prop {number} x.min
 * @prop {number} x.max
 * @prop {Object} y
 * @prop {number} y.min
 * @prop {number} y.max
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
 * Removes a specific child node. Returns the index of the child
 * node removed.
 * @param {Node} elem The element to remove.
 * @param {Element} where Where it is.
 * @returns {number}
 * @private
 */
export function removeChildNode (elem, where) {
  const children = Array.from(where.childNodes)
  for (let i = 0, l = children.length; i < l; i++) {
    const child = children[i]
    if (child === elem) {
      where.removeChild(child)
      return i
    }
  }
  return -1
}
/**
 * Renders a Node.
 * @param {Node} what What to render.
 * @param {Element} where Where to render it.
 * @private
 */
export function render (what, where) {
  // First remove the node, just to make sure it hasn't
  // been rendered before.
  const index = removeChildNode(what, where)
  if (index === -1) {
    if (what instanceof HTMLElement) {
      what.style.display =
        what.style.display === 'none'
          ? 'block'
          : what.style.display
    }
    where.appendChild(what)
  } else if (typeof index === 'number') {
    const nextChild = where.childNodes[index]
    if (what instanceof HTMLElement) {
      what.style.display =
        what.style.display === 'none'
          ? 'block'
          : what.style.display
    }
    if (nextChild instanceof Node) {
      where.insertBefore(what, nextChild)
    } else {
      where.appendChild(what)
    }
  }
}
/**
 * Makes an element draggable. Returns true if the element has been made draggable.
 * @param {HTMLDivElement} elem The element to make draggable.
 * @param {string} draggableID The element that the user has to actually
 * drag to move the element.
 * @param {Bounds} bounds The bounds of the draggable element.
 * @returns {boolean}
 */
export function makeDraggable (elem, draggableID, bounds) {
  let toMoveX = 0
  let toMoveY = 0
  let clientPosX = 0
  let clientPosY = 0
  /**
   * @param {MouseEvent} e
   */
  function onMouseMove (e) {
    e && e.preventDefault()
    // Calculate the new cursor position:
    toMoveX = clientPosX - e.clientX
    toMoveY = clientPosY - e.clientY
    clientPosX = e.clientX
    clientPosY = e.clientY
    // Set the element's new position:
    elem.style.top = bind(
      (elem.offsetTop - toMoveY), bounds.y.min,
      bounds.y.max - parseInt(
        elem.clientHeight, 10
      )
    ) + 'px'
    elem.style.left = bind(
      (elem.offsetLeft - toMoveX), bounds.x.min,
      bounds.x.max - parseInt(
        elem.clientWidth, 10
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
    return true
  } else if (draggableElem) {
    draggableElem.addEventListener('mousedown', onMouseDown)
    return true
  }
  return false
}
