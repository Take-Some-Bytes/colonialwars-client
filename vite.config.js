/**
 * @fileoverview Vite configuration file.
 */

import path from 'path'
import url from 'url'

import { defineConfig } from 'vite'

const DIRNAME = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * Custom XHR route.
 * @type {import('vite').Plugin}
 */
const XhrRoutePlugin = {
  name: 'xhr-route-plugin',
  configureServer: server => {
    server.middlewares.use('/xhr', handleXhr)
  },
  configurePreviewServer: server => {
    server.middlewares.use('/xhr', handleXhr)
  }
}

export default defineConfig({
  plugins: [XhrRoutePlugin],
  build: {
    rollupOptions: {
      input: {
        main: path.join(DIRNAME, './index.html')
      }
    },
    target: 'es2016',
    sourcemap: true
  },
  server: {
    port: 5555,
    host: 'localhost',
    strictPort: true
  },
  preview: {
    port: 5555,
    host: 'localhost',
    strictPort: true
  }
})

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
function handleXhr (req, res) {
  const url = new URL(req.url, 'http://localhost:5555')
  const query = url.searchParams
  const xhrFor = query.get('for')

  if (!xhrFor) {
    res.statusCode = 400
    res.end(JSON.stringify({
      status: 'error',
      error: { message: 'For parameter is required in query!' }
    }))
    return
  }

  switch (xhrFor) {
    case 'serversAvailable': {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.write(JSON.stringify({
        status: 'ok',
        data: {
          serversAvailable: [
            // Send only one server name.
            { serverName: 'Development 1', location: 'http://localhost:4000' }
          ]
        }
      }))
      res.end()
      break
    }
    default: {
      res.statusCode = 400
      res.end(JSON.stringify({
        status: 'error',
        error: { message: 'Unrecognized for parameter!' }
      }))
      break
    }
  }
}
