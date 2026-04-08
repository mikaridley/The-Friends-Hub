import { rooms, socketRoom } from '../models/roomStore.js'

export function registerEliasSocket(io, { HEBREW_WORDS }) {
  function makeCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let s = ''
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
    return s
  }

  function newPlayer({ socketId, name, guestId, isMaster }) {
    return {
      id: crypto.randomUUID(),
      socketId,
      name: String(name || 'Player').slice(0, 32),
      guestId: guestId || null,
      team: null,
      isMaster: !!isMaster,
    }
  }

  function defaultGame() {
    return {
      phase: 'lobby',
      scores: { red: 0, blue: 0 },
      currentTeam: 'red',
      clueGiverId: null,
      redRotation: 0,
      blueRotation: 0,
      turnPhase: 'idle',
      turnEndsAt: null,
      guessedThisTurn: 0,
      passThisTurn: 0,
      winner: null,
      usedWordIds: [],
      turnTimer: null,
    }
  }

  function getTeamMembers(room, team) {
    return room.players.filter((p) => p.team === team)
  }

  function pickClueGiverId(room) {
    const team = room.game.currentTeam
    const members = getTeamMembers(room, team)
    if (members.length === 0) return null
    const rot = team === 'red' ? room.game.redRotation : room.game.blueRotation
    return members[rot % members.length].id
  }

  function nextWord(room) {
    const used = new Set(room.game.usedWordIds)
    const pool = HEBREW_WORDS.map((w, i) => ({ w, i })).filter((x) => !used.has(x.i))
    let pick
    if (pool.length === 0) {
      room.game.usedWordIds = []
      pick = HEBREW_WORDS[Math.floor(Math.random() * HEBREW_WORDS.length)]
      return { word: pick, id: HEBREW_WORDS.indexOf(pick) }
    }
    const choice = pool[Math.floor(Math.random() * pool.length)]
    return { word: choice.w, id: choice.i }
  }

  function clearTurnTimer(room) {
    if (room.game.turnTimer) {
      clearTimeout(room.game.turnTimer)
      room.game.turnTimer = null
    }
  }

  function sanitizePlayer(p) {
    return {
      id: p.id,
      name: p.name,
      team: p.team,
      isMaster: p.isMaster,
    }
  }

  function publicGameState(room) {
    const g = room.game
    if (g.phase === 'lobby') return null
    return {
      phase: g.phase,
      scores: { ...g.scores },
      currentTeam: g.currentTeam,
      clueGiverId: g.clueGiverId,
      turnPhase: g.turnPhase,
      turnEndsAt: g.turnEndsAt,
      guessedThisTurn: g.guessedThisTurn,
      passThisTurn: g.passThisTurn,
      winner: g.winner,
    }
  }

  function broadcastRoom(room) {
    const payload = {
      code: room.code,
      players: room.players.map(sanitizePlayer),
      settings: { ...room.settings },
      game: publicGameState(room),
    }
    io.to(room.code).emit('room:update', payload)
  }

  function emitError(socket, message) {
    socket.emit('error:msg', { message })
  }

  function findRoomBySocket(socketId) {
    const code = socketRoom.get(socketId)
    if (!code) return { room: null, code: null }
    const room = rooms.get(code)
    return { room, code }
  }

  function findPlayer(room, socketId) {
    return room.players.find((p) => p.socketId === socketId)
  }

  function attachSocketToPlayer(room, socket, player) {
    const prev = player.socketId
    if (prev && prev !== socket.id) socketRoom.delete(prev)
    player.socketId = socket.id
    socketRoom.set(socket.id, room.code)
    socket.join(room.code)
  }

  function guestIdsMatch(serverG, clientG) {
    const a = serverG == null || serverG === '' ? null : String(serverG)
    const b = clientG == null || clientG === '' ? null : String(clientG)
    if (a === b) return true
    if (a === null || b === null) return true
    return a === b
  }

  function resolveRoomAndPlayer(socket, payload = {}) {
    let room = findRoomBySocket(socket.id).room
    const hintCode = typeof payload.code === 'string' ? payload.code.trim().toUpperCase() : ''
    const hintPlayerId = typeof payload.playerId === 'string' ? payload.playerId : ''
    const hintGuestId = payload.guestId != null ? String(payload.guestId) : ''

    if (!room && hintCode) room = rooms.get(hintCode)

    if (!room) return { room: null, player: null }

    let player = findPlayer(room, socket.id)
    if (!player && hintPlayerId) {
      const p = room.players.find((x) => x.id === hintPlayerId)
      if (p && guestIdsMatch(p.guestId, hintGuestId)) {
        attachSocketToPlayer(room, socket, p)
        player = p
      }
    }

    return { room, player }
  }

  function endTurn(room) {
    clearTurnTimer(room)
    const g = room.game
    const pts = g.guessedThisTurn - g.passThisTurn
    g.scores[g.currentTeam] += pts

    if (g.scores[g.currentTeam] >= room.settings.targetScore) {
      g.phase = 'finished'
      g.winner = g.currentTeam
      g.turnPhase = 'idle'
      g.turnEndsAt = null
      g.clueGiverId = null
      broadcastRoom(room)
      return
    }

    if (g.currentTeam === 'red') g.redRotation++
    else g.blueRotation++

    g.currentTeam = g.currentTeam === 'red' ? 'blue' : 'red'
    g.clueGiverId = pickClueGiverId(room)
    g.turnPhase = 'awaiting_start'
    g.turnEndsAt = null
    g.guessedThisTurn = 0
    g.passThisTurn = 0

    if (!g.clueGiverId) {
      g.phase = 'finished'
      g.winner = g.scores.red >= g.scores.blue ? 'red' : 'blue'
    }

    broadcastRoom(room)
  }

  function scheduleTurnEnd(room, durationMs) {
    clearTurnTimer(room)
    room.game.turnTimer = setTimeout(() => {
      const r = rooms.get(room.code)
      if (!r || r.game.phase !== 'playing' || r.game.turnPhase !== 'running') return
      endTurn(r)
    }, durationMs)
  }

  function sendSecretWordToClueGiver(room, wordPayload) {
    const clue = room.players.find((p) => p.id === room.game.clueGiverId)
    if (!clue) return
    io.to(clue.socketId).emit('word:secret', wordPayload)
  }

  io.on('connection', (socket) => {
    socket.on('room:create', ({ name, guestId }, cb) => {
      let code = makeCode()
      while (rooms.has(code)) code = makeCode()
      const master = newPlayer({ socketId: socket.id, name, guestId, isMaster: true })
      const room = {
        code,
        players: [master],
        settings: { turnSeconds: 60, targetScore: 25 },
        game: defaultGame(),
      }
      rooms.set(code, room)
      socket.join(code)
      socketRoom.set(socket.id, code)
      broadcastRoom(room)
      if (typeof cb === 'function') cb({ ok: true, code, playerId: master.id })
    })

    socket.on('room:join', ({ code, name, guestId }, cb) => {
      const upper = String(code || '').trim().toUpperCase()
      const room = rooms.get(upper)
      if (!room) {
        if (typeof cb === 'function') cb({ ok: false, error: 'Room not found' })
        return emitError(socket, 'Room not found')
      }
      if (room.game.phase !== 'lobby') {
        if (typeof cb === 'function') cb({ ok: false, error: 'Game already started' })
        return emitError(socket, 'Game already started')
      }
      const existing = findPlayer(room, socket.id)
      if (existing) {
        if (typeof cb === 'function') cb({ ok: true, code: upper, playerId: existing.id })
        return
      }
      const player = newPlayer({ socketId: socket.id, name, guestId, isMaster: false })
      room.players.push(player)
      socket.join(upper)
      socketRoom.set(socket.id, upper)
      broadcastRoom(room)
      if (typeof cb === 'function') cb({ ok: true, code: upper, playerId: player.id })
    })

    socket.on('team:join', ({ team }) => {
      const { room } = findRoomBySocket(socket.id)
      if (!room || room.game.phase !== 'lobby') return
      const p = findPlayer(room, socket.id)
      if (!p) return
      if (team !== 'red' && team !== 'blue') return
      p.team = team
      broadcastRoom(room)
    })

    socket.on('teams:randomize', () => {
      const { room } = findRoomBySocket(socket.id)
      if (!room || room.game.phase !== 'lobby') return
      const master = findPlayer(room, socket.id)
      if (!master?.isMaster) return emitError(socket, 'Only the host can do that')
      const ps = [...room.players]
      for (let i = ps.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[ps[i], ps[j]] = [ps[j], ps[i]]
      }
      const mid = Math.ceil(ps.length / 2)
      ps.forEach((player, i) => {
        const rp = room.players.find((x) => x.id === player.id)
        if (rp) rp.team = i < mid ? 'red' : 'blue'
      })
      broadcastRoom(room)
    })

    socket.on('settings:update', ({ turnSeconds, targetScore }) => {
      const { room } = findRoomBySocket(socket.id)
      if (!room || room.game.phase !== 'lobby') return
      const master = findPlayer(room, socket.id)
      if (!master?.isMaster) return emitError(socket, 'Only the host can do that')
      if (typeof turnSeconds === 'number' && turnSeconds >= 10 && turnSeconds <= 600) {
        room.settings.turnSeconds = Math.floor(turnSeconds)
      }
      if (typeof targetScore === 'number' && targetScore >= 1 && targetScore <= 999) {
        room.settings.targetScore = Math.floor(targetScore)
      }
      broadcastRoom(room)
    })

    socket.on('game:start', () => {
      const { room } = findRoomBySocket(socket.id)
      if (!room) return
      const master = findPlayer(room, socket.id)
      if (!master?.isMaster) return emitError(socket, 'Only the host can do that')
      const reds = getTeamMembers(room, 'red')
      const blues = getTeamMembers(room, 'blue')
      if (reds.length === 0 || blues.length === 0) {
        return emitError(socket, 'Need at least one player on each team')
      }
      room.game = defaultGame()
      room.game.phase = 'playing'
      room.game.currentTeam = Math.random() < 0.5 ? 'red' : 'blue'
      room.game.redRotation = 0
      room.game.blueRotation = 0
      room.game.clueGiverId = pickClueGiverId(room)
      room.game.turnPhase = 'awaiting_start'
      broadcastRoom(room)
    })

    socket.on('turn:start', () => {
      const { room } = findRoomBySocket(socket.id)
      if (!room || room.game.phase !== 'playing') return
      const p = findPlayer(room, socket.id)
      if (!p || p.id !== room.game.clueGiverId) return emitError(socket, 'Not your turn')
      if (room.game.turnPhase !== 'awaiting_start') return
      const { word, id } = nextWord(room)
      room.game.usedWordIds.push(id)
      room.game.turnPhase = 'running'
      const ends = Date.now() + room.settings.turnSeconds * 1000
      room.game.turnEndsAt = ends
      sendSecretWordToClueGiver(room, { word })
      scheduleTurnEnd(room, room.settings.turnSeconds * 1000)
      broadcastRoom(room)
    })

    socket.on('elias_return_to_lobby', (payload = {}) => {
      const { room, player } = resolveRoomAndPlayer(socket, payload)
      if (!room) return emitError(socket, 'Room not found')
      if (!player?.isMaster) return emitError(socket, 'Only the host can do that')
      if (room.game.phase !== 'finished') return emitError(socket, 'Only after the game has finished')
      clearTurnTimer(room)
      room.game = defaultGame()
      broadcastRoom(room)
    })

    socket.on('turn:word', ({ result }) => {
      const { room } = findRoomBySocket(socket.id)
      if (!room || room.game.phase !== 'playing') return
      const p = findPlayer(room, socket.id)
      if (!p || p.id !== room.game.clueGiverId) return
      if (room.game.turnPhase !== 'running') return
      if (Date.now() > room.game.turnEndsAt) return
      if (result === 'guessed') room.game.guessedThisTurn++
      else if (result === 'pass') room.game.passThisTurn++
      else return
      const { word, id } = nextWord(room)
      room.game.usedWordIds.push(id)
      sendSecretWordToClueGiver(room, { word })
      broadcastRoom(room)
    })

    socket.on('disconnect', () => {
      const { room, code } = findRoomBySocket(socket.id)
      if (!room || !code) return
      const leaving = findPlayer(room, socket.id)
      const wasMaster = leaving?.isMaster
      room.players = room.players.filter((p) => p.socketId !== socket.id)
      socketRoom.delete(socket.id)
      if (room.players.length === 0) {
        clearTurnTimer(room)
        rooms.delete(code)
        return
      }
      if (wasMaster) room.players[0].isMaster = true
      if (room.game.phase === 'playing' && room.game.clueGiverId) {
        const still = room.players.some((p) => p.id === room.game.clueGiverId)
        if (!still) {
          clearTurnTimer(room)
          room.game.clueGiverId = pickClueGiverId(room)
          room.game.turnPhase = 'awaiting_start'
          room.game.turnEndsAt = null
        }
      }
      broadcastRoom(room)
    })
  })
}
