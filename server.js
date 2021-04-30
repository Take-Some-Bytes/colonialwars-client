/* eslint-env node */
/**
 * @fileoverview Development server for Colonial Wars frontend.
 */

const fs = require('fs')
const path = require('path')
const http = require('http')
const qs = require('querystring')
const connect = require('connect')
const serveStatic = require('serve-static')
const finalHandler = require('finalhandler')

const app = connect()
const server = http.createServer(app)

let port = process.argv[2] || 5555

app.use((req, res, next) => {
  console.log(`Request received for URL ${req.url} with method ${req.method}.`)
  next()
})
app.use((req, res, next) => {
  const url = new URL(req.url, `http://localhost:${port}`)
  const query = url.search
  // Parse the query string.
  if (query && /^\?.+/.test(query)) {
    const parsedQs = qs.parse(url.search.substring(1))
    if (parsedQs && typeof parsedQs === 'object') {
      req.query = parsedQs
    }
  }
  next()
})
app.use(serveStatic(path.join(__dirname, 'client'), {
  cacheControl: false,
  extensions: ['html']
}))
app.use('/favicon.ico', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next()
  }

  const stream = fs.createReadStream(path.join(__dirname, 'client/imgs/favicon.ico'))
  stream.on('open', () => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'image/x-icon')
    stream.pipe(res)
  })
  stream.on('error', err => {
    console.log(err.stack)
    stream.destroy()
    return next(err)
  })
})
app.use('/xhr', (req, res, next) => {
  const query = req.query

  if (!query || typeof query !== 'object') {
    res.statusCode = 400
    next(new Error('Query is required!'))
    return
  } else if (!query.for) {
    res.statusCode = 400
    next(new Error('For parameter is required in query!'))
    return
  }

  switch (query.for) {
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
      next(new Error('Unrecognized for parameter!'))
      break
    }
  }
})
app.use((req, res) => {
  finalHandler(req, res)()
})
app.use((err, req, res, next) => {
  finalHandler(req, res)(err)
})

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.log('Address in use, incrementing and retrying...')
    setTimeout(() => {
      port++
      server.listen(port, () => {
        console.log(`Server listening on port ${port}.`)
      })
    }, 1000)
  } else {
    throw err
  }
})

console.log(`Server listening on port ${port}.`)
server.listen(port)
