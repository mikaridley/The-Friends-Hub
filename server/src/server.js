import 'dotenv/config'
import http from 'http'
import express from 'express'
import { Server } from 'socket.io'
import httpRoutes from './routes/index.js'
import { HEBREW_WORDS } from './models/hebrewWords.js'
import { registerEliasSocket } from './socket/elias.js'

const PORT = Number(process.env.PORT) || 3000
const app = express()
app.use(httpRoutes)

const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
  },
})

registerEliasSocket(io, { HEBREW_WORDS })

httpServer.listen(PORT, () => {
  console.log(`Elias server listening on port ${PORT}`)
})
