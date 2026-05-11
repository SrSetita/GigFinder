import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null
  if (!socket) {
    const token = localStorage.getItem('gf_token')
    socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
      auth: { token },
      autoConnect: false,
    })
  }
  return socket
}

export function connectSocket(): Socket | null {
  const s = getSocket()
  if (!s) return null
  if (!s.connected) s.connect()
  return s
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect()
  socket = null
}
