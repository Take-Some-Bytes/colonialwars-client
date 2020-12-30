/* eslint-env node */
/**
 * @fileoverview Development server for Colonial Wars frontend.
 */

const fs = require('fs')
const path = require('path')
const http = require('http')
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
    return next()
  })
})
app.use((req, res) => {
  finalHandler(req, res)()
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
