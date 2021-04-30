/* eslint-env browser */
/**
 * @fileoverview Main client JS file page.
 */

import { ViewportDimensions } from './helpers/display-utils.js'

const url = window.location.pathname
const vwDimensions = new ViewportDimensions()
/**
 * @type {typeof import('./apps/lobby-app.js').default}
 */
let LobbyApp = null
/**
 * @type {typeof import('./apps/play-app.js').default}
 */
let PlayApp = null

let lobbyApp = null
let playApp = null

/**
 * Function to start the Colonial Wars game client.
 * @param {import('./apps/lobby-app.js').PlayData} playData The data about the
 * game that this client is playing, their team, and their name.
 */
async function play (playData) {
  if (!PlayApp) {
    PlayApp = (await import('./apps/play-app.js')).default
  }
  console.log('Success!')
  console.log(playData)

  lobbyApp.hide()

  playApp = new PlayApp({
    auth: playData.auth,
    gameID: playData.gameID,
    serverLoc: playData.serverLoc,
    playername: playData.playerName,
    playerteam: playData.playerTeam,
    viewportDimensions: vwDimensions
  })

  await playApp.init()
  playApp.run()
}
/**
 * Fetches the map preview metadata.
 * @returns {Promise<Record<string, any>|false>}
 */
async function fetchPreviewMeta () {
  const res = await fetch('/meta/images.meta.json')
  if (!res.ok) {
    console.error('Preview metadata fetch failed.')
    document.body.innerHTML = ''
    document.body.appendChild(document.createTextNode(
      'Something went wrong. Please report this to developers.'
    ))
    return false
  }

  return await res.json()
}

if (url === '/') {
  ;(async () => {
    const previewData = await fetchPreviewMeta()
    if (!previewData) {
      // Failed to fetch preview data.
      return
    }

    if (!LobbyApp) {
      LobbyApp = (await import('./apps/lobby-app.js')).default
    }

    lobbyApp = new LobbyApp({
      viewportDimensions: vwDimensions,
      previewMeta: previewData,
      onPlayerReady: play
    })
    window.addEventListener('resize', () => {
      vwDimensions.update()
    })

    lobbyApp.init()
    lobbyApp.show()
  })()
}
