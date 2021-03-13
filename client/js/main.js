/* eslint-env browser */
/**
 * @fileoverview Main client JS file page.
 */

/**
 * TODO: Make this import truly dynamic.
 * The only reason I used dynamic import here is so that we could
 * dynamically load the right app class, based on what page
 * this file was loaded from.
 * (12/22/2020) Take-Some-Bytes */
;(async () => {
  const App = (await import('./apps/lobby-app.js')).default
  new App().run()
})()
