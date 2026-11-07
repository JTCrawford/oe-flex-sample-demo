import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cesiumBuild = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'node_modules/cesium/Build/Cesium')
const cesiumFolders = ['Workers', 'ThirdParty', 'Assets', 'Widgets']

// https://vite.dev/config/
export default defineConfig({
  define: {
    CESIUM_BASE_URL: JSON.stringify('./cesium/'),
  },
  build: {
    chunkSizeWarningLimit: 4500,
  },
  plugins: [
    react(),
    cesiumStatic(),
    {
      name: 'dev-aircraft-proxy',
      configureServer(server) {
        server.middlewares.use('/api/aircraft', (req, res, next) => {
          if (req.method !== 'GET') {
            next()
            return
          }
          void (async () => {
            try {
              const mod = (await server.ssrLoadModule(
                path.join(repoRoot, 'api/aircraft.ts'),
              )) as { GET: (request: Request) => Promise<Response> }
              const upstream = await mod.GET(
                new Request(`http://127.0.0.1${req.url ?? '/api/aircraft'}`),
              )
              res.statusCode = upstream.status
              upstream.headers.forEach((value, key) => {
                res.setHeader(key, value)
              })
              res.end(Buffer.from(await upstream.arrayBuffer()))
            } catch {
              res.statusCode = 503
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ offline: true, aircraft: [], error: 'dev proxy failed' }))
            }
          })()
        })
      },
    },
    {
      name: 'dev-terrain-proxy',
      configureServer(server) {
        server.middlewares.use('/api/terrain', (req, res, next) => {
          if (req.method !== 'GET') {
            next()
            return
          }
          void (async () => {
            try {
              const mod = (await server.ssrLoadModule(
                path.join(repoRoot, 'api/terrain.ts'),
              )) as { GET: (request: Request) => Promise<Response> }
              const upstream = await mod.GET(
                new Request(`http://127.0.0.1${req.url ?? '/api/terrain'}`),
              )
              res.statusCode = upstream.status
              upstream.headers.forEach((value, key) => {
                res.setHeader(key, value)
              })
              res.end(Buffer.from(await upstream.arrayBuffer()))
            } catch {
              res.statusCode = 503
              res.end('terrain proxy failed')
            }
          })()
        })
      },
    },
  ],
  base: './',
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
})

function cesiumStatic() {
  return {
    name: 'cesium-static',
    configureServer(server: { middlewares: { use: (path: string, handler: (req: { url?: string }, res: { setHeader: (name: string, value: string) => void }, next: () => void) => void) => void } }) {
      server.middlewares.use('/cesium', (req, res, next) => {
        const raw = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/')
        const file = path.normalize(path.join(cesiumBuild, raw))
        if (!file.startsWith(cesiumBuild) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
          next()
          return
        }
        res.setHeader('Content-Type', cesiumMime(file))
        fs.createReadStream(file).pipe(res as unknown as NodeJS.WritableStream)
      })
    },
    closeBundle() {
      const destRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist/cesium')
      for (const folder of cesiumFolders) {
        fs.cpSync(path.join(cesiumBuild, folder), path.join(destRoot, folder), { recursive: true })
      }
    },
  }
}

function cesiumMime(file: string): string {
  if (file.endsWith('.js')) return 'text/javascript'
  if (file.endsWith('.css')) return 'text/css'
  if (file.endsWith('.json')) return 'application/json'
  if (file.endsWith('.wasm')) return 'application/wasm'
  if (file.endsWith('.png')) return 'image/png'
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) return 'image/jpeg'
  if (file.endsWith('.svg')) return 'image/svg+xml'
  if (file.endsWith('.gif')) return 'image/gif'
  return 'application/octet-stream'
}
