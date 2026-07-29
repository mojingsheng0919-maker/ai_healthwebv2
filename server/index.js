import { createServer } from 'http'
import { request as httpRequest } from 'http'
import { resolve, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import { createReadStream, existsSync, statSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dirname, '..', 'dist')
const PORT = process.env.PORT || 3000
const BACKEND = process.env.BACKEND || 'http://159.75.169.224:1235'
const BACKEND_URL = new URL(BACKEND)

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2'
}

function serveStatic(res, filePath) {
  const ext = extname(filePath).toLowerCase()
  const mime = MIME[ext] || 'application/octet-stream'
  const stat = statSync(filePath)
  res.writeHead(200, { 'content-type': mime, 'content-length': stat.size })
  createReadStream(filePath).pipe(res)
}

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  
  // API proxy: pipe request to backend and pipe response back
  if (url.pathname.startsWith('/api')) {
    const options = {
      hostname: BACKEND_URL.hostname,
      port: BACKEND_URL.port,
      path: url.pathname + url.search,
      method: req.method,
      headers: { ...req.headers }
    }
    // Clean up headers that may cause issues
    delete options.headers.host
    delete options.headers['x-forwarded-host']
    delete options.headers['x-forwarded-proto']
    options.headers.host = BACKEND_URL.host

    const proxyReq = httpRequest(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res)
    })

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err.message)
      if (!res.headersSent) {
        res.writeHead(502, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ error: 'Proxy error', message: err.message }))
      }
    })

    req.pipe(proxyReq)
    return
  }

  // Static file
  const filePath = resolve(DIST, url.pathname.slice(1) || 'index.html')
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    serveStatic(res, filePath)
    return
  }

  // SPA fallback
  const indexPath = resolve(DIST, 'index.html')
  if (existsSync(indexPath)) {
    serveStatic(res, indexPath)
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

server.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT)
  console.log('Proxying /api/* -> ' + BACKEND)
  console.log('Serving static <- ' + DIST)
})