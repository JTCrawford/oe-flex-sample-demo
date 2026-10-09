import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
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
  ],
  base: './',
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
})
