const { Server } = require('socket.io')
const supabase = require('../lib/supabase')

function setupSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // Verify Supabase JWT on every socket connection
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Authentication required'))

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return next(new Error('Invalid token'))

    socket.userId = user.id
    next()
  })

  io.on('connection', socket => {
    // Each authenticated user joins their own private room so the REST
    // routes can target them with io.to(`user:${id}`).emit(...)
    socket.join(`user:${socket.userId}`)

    socket.on('disconnect', () => {
      // socket.io handles room cleanup automatically
    })
  })

  return io
}

module.exports = { setupSocket }
