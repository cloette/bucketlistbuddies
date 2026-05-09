require('dotenv').config()
const express = require('express')
const { createServer } = require('http')
const cors = require('cors')
const helmet = require('helmet')
const { setupSocket } = require('./socket')
const { generalLimiter } = require('./middleware/rateLimiter')

const ideasRouter    = require('./routes/ideas')
const forumRouter    = require('./routes/forum')
const messagesRouter = require('./routes/messages')
const usersRouter    = require('./routes/users')

const app = express()
const httpServer = createServer(app)

// Socket.io (must be set up before routes that call req.app.get('io'))
const io = setupSocket(httpServer)
app.set('io', io)

// Trust Render's proxy so req.ip is the real client IP (needed for rate limiting)
app.set('trust proxy', 1)

app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(generalLimiter)

// Health check — used by Render to confirm the service is up
app.get('/health', (_req, res) => res.json({ ok: true }))

app.use('/api/ideas',    ideasRouter)
app.use('/api/forum',    forumRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/users',    usersRouter)

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[error]', err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
