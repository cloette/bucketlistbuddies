import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

const SOCKET_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export function SocketProvider({ children }) {
  const { session } = useAuth()
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    if (!session?.access_token) {
      setSocket(prev => { prev?.disconnect(); return null })
      return
    }

    const s = io(SOCKET_URL, {
      auth: { token: session.access_token },
      transports: ['websocket', 'polling'],  // polling fallback for Render cold-starts
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    })

    // Suppress repeated connect_error noise in the browser console
    s.on('connect_error', (err) => {
      console.debug('[socket] connect error:', err.message)
    })

    setSocket(s)
    return () => { s.disconnect(); setSocket(null) }
  }, [session?.access_token])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
