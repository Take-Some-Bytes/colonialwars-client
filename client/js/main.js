/* eslint-env browser */
/**
 * @fileoverview Main client JS file page.
 */

import App from './apps/app.js'

(async () => {
  const app = new App()
  await app.init()
  app.run()
})()
