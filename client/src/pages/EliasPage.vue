<template>
  <div class="elias-page" :class="gameBackdropClass">
    <p v-if="errorMsg" class="elias-page__error" role="alert">{{ errorMsg }}</p>
    <p v-if="connectError" class="elias-page__error">
      <template v-if="isProd">
        לא ניתן להתחבר לשרת ה־API. ב־Render: בשירות ה־Static Site הגדר משתנה סביבה
        <code>VITE_SOCKET_URL</code>
        לכתובת ה־Web Service (למשל <code>https://שם-השרת.onrender.com</code>), שמור ובצע
        <strong>Deploy</strong>
        מחדש. בשרת: <code>CORS_ORIGIN</code>
        חייב לכלול את כתובת האתר הסטטי (כולל <code>https://</code>).
      </template>
      <template v-else>
        לא ניתן להתחבר לשרת. הרץ את השרת במקביל ל־Vite:
        <code>npm run dev:full</code>
        או בשני חלונות:
        <code>npm run server</code>
        ו־
        <code>npm run dev</code>
        .
      </template>
    </p>

    <section v-if="step === 'name'" class="elias-page__panel" dir="rtl">
      <h2 class="elias-page__title">משחק אליאס</h2>
      <label class="elias-page__field">
        <span>שם להצגה</span>
        <input v-model="name" type="text" maxlength="32" autocomplete="nickname" @keydown.enter="onContinue" />
      </label>
      <button type="button" class="elias-page__btn" @click="onContinue">המשך</button>
    </section>

    <section v-else-if="step === 'gate'" class="elias-page__panel" dir="rtl">
      <h2 class="elias-page__title">התחברות לחדר</h2>
      <p v-if="!connected" class="elias-page__muted">מתחבר לשרת…</p>
      <template v-else>
        <button type="button" class="elias-page__btn" @click="onCreateRoom">צור חדר חדש</button>
        <div class="elias-page__join">
          <label class="elias-page__field">
            <span>קוד חדר</span>
            <input v-model="joinCode" type="text" maxlength="8" autocomplete="off" placeholder="למשל ABC123" @keydown.enter="onJoinRoom" />
          </label>
          <button type="button" class="elias-page__btn elias-page__btn-secondary" @click="onJoinRoom">הצטרף</button>
        </div>
      </template>
    </section>

    <p v-else-if="step === 'room' && !room" class="elias-page__muted" dir="rtl">טוען חדר…</p>
    <EliasLobby
      v-else-if="step === 'room' && room && !room.game"
      :room="room"
      :player-id="playerId"
      @join-team="onJoinTeam"
      @randomize-teams="onRandomizeTeams"
      @update-settings="onUpdateSettings"
      @start-game="onStartGame"
    />
    <EliasGame
      v-else-if="step === 'room' && room?.game"
      :room="room"
      :player-id="playerId"
      :is-master="isMaster"
      :secret-word="secretWord"
      @start-turn="onStartTurn"
      @word-result="onWordResult"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, provide, ref } from 'vue'
import { createEliasSocket } from '../services/eliasSocket.js'
import EliasLobby from '../cmps/elias/EliasLobby.vue'
import EliasGame from '../cmps/elias/EliasGame.vue'

const socket = createEliasSocket()

const step = ref('name')
const name = ref(typeof localStorage !== 'undefined' ? localStorage.getItem('elias-display-name') || '' : '')
const guestId = ref('')
const connected = ref(false)
const connectError = ref(false)
const joinCode = ref('')
const room = ref(null)
const playerId = ref('')
const secretWord = ref('')
const errorMsg = ref('')

function onReturnToLobby() {
  const payload = {
    code: room.value?.code,
    playerId: playerId.value,
    guestId: guestId.value,
  }
  const send = () => socket.emit('elias_return_to_lobby', payload)
  if (socket.connected) {
    send()
    return
  }
  errorMsg.value = 'מתחבר לשרת…'
  socket.once('connect', send)
  socket.connect()
}

provide('eliasReturnToLobby', onReturnToLobby)

const isProd = import.meta.env.PROD

const isMaster = computed(() => {
  const p = room.value?.players?.find((x) => x.id === playerId.value)
  return !!p?.isMaster
})

const gameBackdropClass = computed(() => {
  if (step.value !== 'room' || !room.value?.game) return {}
  const g = room.value.game
  if (g.phase === 'finished') return { 'elias-page--bg-finished': true, 'elias-page--in-game': true }
  if (g.phase === 'playing' && g.currentTeam === 'red') return { 'elias-page--turn-red': true, 'elias-page--in-game': true }
  if (g.phase === 'playing' && g.currentTeam === 'blue') return { 'elias-page--turn-blue': true, 'elias-page--in-game': true }
  return { 'elias-page--in-game': true }
})

function ensureGuestId() {
  let gid = localStorage.getItem('elias-guest-id')
  if (!gid) {
    gid = crypto.randomUUID()
    localStorage.setItem('elias-guest-id', gid)
  }
  guestId.value = gid
}

function onRoomUpdate(payload) {
  room.value = payload
  if (payload.game?.turnPhase !== 'running') secretWord.value = ''
}

function onWordSecret({ word }) {
  secretWord.value = word
}

function onErrorMsg({ message }) {
  errorMsg.value = message
  window.setTimeout(() => {
    errorMsg.value = ''
  }, 5000)
}

onMounted(() => {
  ensureGuestId()
  socket.on('connect', () => {
    connected.value = true
    connectError.value = false
  })
  socket.on('disconnect', () => {
    connected.value = false
  })
  socket.on('connect_error', () => {
    connectError.value = true
  })
  socket.on('room:update', onRoomUpdate)
  socket.on('word:secret', onWordSecret)
  socket.on('error:msg', onErrorMsg)
})

onUnmounted(() => {
  socket.off('connect')
  socket.off('disconnect')
  socket.off('connect_error')
  socket.off('room:update', onRoomUpdate)
  socket.off('word:secret', onWordSecret)
  socket.off('error:msg', onErrorMsg)
  socket.disconnect()
})

function onContinue() {
  const n = name.value.trim()
  if (!n) return
  localStorage.setItem('elias-display-name', n)
  name.value = n
  step.value = 'gate'
  socket.connect()
}

function onCreateRoom() {
  socket.emit('room:create', { name: name.value.trim(), guestId: guestId.value }, (res) => {
    if (res?.ok && res.playerId) {
      playerId.value = res.playerId
      step.value = 'room'
    } else if (res?.error) errorMsg.value = res.error
  })
}

function onJoinRoom() {
  const code = joinCode.value.trim().toUpperCase()
  if (!code) return
  socket.emit('room:join', { code, name: name.value.trim(), guestId: guestId.value }, (res) => {
    if (res?.ok && res.playerId) {
      playerId.value = res.playerId
      step.value = 'room'
    } else if (res?.error) errorMsg.value = res.error
  })
}

function onJoinTeam(team) {
  socket.emit('team:join', { team })
}

function onRandomizeTeams() {
  socket.emit('teams:randomize')
}

function onUpdateSettings(payload) {
  socket.emit('settings:update', payload)
}

function onStartGame() {
  socket.emit('game:start')
}

function onStartTurn() {
  socket.emit('turn:start')
}

function onWordResult(result) {
  socket.emit('turn:word', { result })
}

</script>

<style scoped>
.elias-page {
  position: relative;
  display: grid;
  gap: 1rem;
  max-width: 56rem;
  margin-inline: auto;
  transition: background-color 0.35s ease;

  &.elias-page--in-game {
    max-width: min(92rem, 100%);
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
    min-height: calc(100dvh - 7rem);
  }
}

.elias-page__error {
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background: var(--clr-team-red-muted);
  color: var(--clr-team-red);
  font-weight: 600;
}

.elias-page__panel {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid var(--clr-elias-border);
  background: var(--clr-elias-surface);
}

.elias-page__title {
  margin: 0;
  color: var(--prime-text);
}

.elias-page__field {
  display: grid;
  gap: 0.35rem;
  color: var(--sec-text);

  input {
    padding: 0.6rem 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid var(--clr-elias-border);
    background: var(--sec-bg);
    color: var(--prime-text);
  }
}

.elias-page__btn {
  padding: 0.65rem 1rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-weight: 700;
  background: var(--clr-team-blue);
  color: var(--light-text);
}

.elias-page__btn-secondary {
  background: var(--prime-accent-500);
}

.elias-page__join {
  display: grid;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--clr-elias-border);
}

.elias-page__muted {
  margin: 0;
  color: var(--sec-text);
}
</style>
