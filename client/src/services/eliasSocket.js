import { io } from 'socket.io-client'

/**
 * In dev, use the Vite origin so requests go to :5173 and `vite.config` proxies
 * `/socket.io` → the Elias server on :3000. The server must still be running.
 * Override with VITE_SOCKET_URL (e.g. production or preview against a real API host).
 */
export function getEliasSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL
  if (import.meta.env.DEV && typeof window !== 'undefined') return window.location.origin
  if (typeof window !== 'undefined') return window.location.origin
  return 'http://127.0.0.1:3000'
}

export function createEliasSocket() {
  return io(getEliasSocketUrl(), {
    autoConnect: false,
    transports: ['polling', 'websocket'],
  })
}
