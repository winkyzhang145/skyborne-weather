import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 简易 .env 加载（无需依赖）
function loadEnv() {
  const envPath = path.join(__dirname, '.env')
  if (!fs.existsSync(envPath)) return
  const txt = fs.readFileSync(envPath, 'utf8')
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/i)
    if (!m) continue
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2]
  }
}
loadEnv()

const PORT = process.env.PORT || 5173
const HOST = process.env.HOST || '127.0.0.1'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.map':  'application/json; charset=utf-8'
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    let pathname = decodeURIComponent(url.pathname)
    if (pathname === '/') pathname = '/index.html'

    // API proxy to QWeather (避免浏览器 CORS 与 Key 暴露)
    if (pathname.startsWith('/api/qweather/')) {
      const subPath = pathname.replace('/api/qweather/', '')
      const target = `https://${process.env.QWEATHER_HOST || 'devapi.qweather.com'}/v7/${subPath}${url.search}`
      const headers = {
        'X-QW-Api-Key': process.env.QWEATHER_KEY || ''
      }
      const upstream = await fetch(target, { headers })
      const body = await upstream.text()
      res.writeHead(upstream.status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      })
      res.end(body)
      return
    }

    if (pathname.startsWith('/api/geo/')) {
      const subPath = pathname.replace('/api/geo/', '')
      const target = `https://${process.env.QWEATHER_HOST || 'devapi.qweather.com'}/geo/v2/${subPath}${url.search}`
      const headers = { 'X-QW-Api-Key': process.env.QWEATHER_KEY || '' }
      const upstream = await fetch(target, { headers })
      const body = await upstream.text()
      res.writeHead(upstream.status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      })
      res.end(body)
      return
    }

    const filePath = path.join(__dirname, pathname)
    if (!filePath.startsWith(__dirname)) {
      res.writeHead(403); res.end('Forbidden'); return
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Not Found: ' + pathname)
      return
    }
    const ext = path.extname(filePath).toLowerCase()
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })
    fs.createReadStream(filePath).pipe(res)
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Server Error: ' + err.message)
  }
})

server.listen(PORT, HOST, () => {
  console.log(`\n  3D Weather running at:\n  http://${HOST}:${PORT}\n`)
})
