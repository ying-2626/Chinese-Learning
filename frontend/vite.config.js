import net from 'node:net'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const BACKEND_HOST = '127.0.0.1'
const BACKEND_PORT = 8088

function canUseLocalFallback() {
  return process.env.VITE_ENABLE_LOCAL_FALLBACK !== 'false'
}

function isBackendListening() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: BACKEND_HOST, port: BACKEND_PORT })
    const done = (available) => {
      socket.removeAllListeners()
      socket.destroy()
      resolve(available)
    }

    socket.setTimeout(120)
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
  })
}

function sendResult(res, result) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({ code: 0, message: 'success', result }))
}

function createLocalDevUser(username) {
  const displayName = username?.trim() || '本地学习者'
  const safeName = displayName.replace(/[^\w-]/g, '-').slice(0, 32) || 'learner'

  return {
    id: `local-dev-${safeName}`,
    username: displayName,
    email: `${safeName}@local.dev`,
    sessionId: `local-dev-${safeName}-${Date.now()}`,
    scoreActionList: []
  }
}

function localBackendFallbackPlugin() {
  return {
    name: 'local-backend-fallback',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!canUseLocalFallback()) {
          next()
          return
        }

        const requestUrl = new URL(req.url || '/', 'http://localhost')
        const isLogin = req.method === 'POST' && requestUrl.pathname === '/user/login'
        const isScoreHistory =
          req.method === 'GET' && requestUrl.pathname === '/user/findCurrentUserScoreActions'

        if (!isLogin && !isScoreHistory) {
          next()
          return
        }

        if (await isBackendListening()) {
          next()
          return
        }

        if (isLogin) {
          sendResult(res, createLocalDevUser(requestUrl.searchParams.get('username')))
          return
        }

        sendResult(res, [])
      })
    }
  }
}

export default defineConfig({
  plugins: [localBackendFallbackPlugin(), vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8088',
      '/user': 'http://localhost:8088',
      '/scoreAction': 'http://localhost:8088',
      '/audios': 'http://localhost:8088'
    }
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
})
