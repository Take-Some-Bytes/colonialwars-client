/**
 * @fileoverview Snowpack configuration file.
 */

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
function handleXhr (req, res) {
  const url = new URL(req.url, 'http://localhost:5555')
  const query = url.searchParams
  const xhrFor = query.get('for')
  // const query = req.query

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
            // { serverName: 'Development 1', location: 'http://0.0.0.0:4000' }
            // { serverName: 'Development 1', location: 'http://dev1.colonialwars.localhost:4000' },
            // { serverName: 'Development 1', location: 'http://192.168.1.110:4000' }
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

/**
 * @type {import('snowpack').SnowpackUserConfig}
 */
module.exports = exports = {
  mount: {
    public: '/',
    src: '/js'
  },
  routes: [{
    // For development only.
    match: 'routes',
    src: '/xhr',
    dest: handleXhr
  }],
  buildOptions: {
    out: 'dist'
  },
  devOptions: {
    port: 5555
  },
  plugins: [
    '@snowpack/plugin-dotenv'
  ],
  optimize: {
    minify: true,
    bundle: true,
    target: 'es2015'
  }
}
