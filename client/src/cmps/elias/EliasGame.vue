<template>
  <section class="elias-game" dir="rtl">
    <div class="elias-game__layout">
      <aside
        class="elias-game__side elias-game__side--red"
        :class="{ 'elias-game__side--turn-active': isSideTurnActive('red') }"
        aria-label="קבוצה אדומה"
      >
        <h3 class="elias-game__side-title">קבוצה אדומה</h3>
        <p class="elias-game__side-score">{{ game.scores.red }} נק׳</p>
        <div v-if="game.phase === 'playing'" class="elias-game__side-clue-box" aria-live="polite">
          <p v-if="game.currentTeam === 'red'" class="elias-game__side-clue-line">
            <span class="elias-game__side-clue-label">מסביר עכשיו</span>
            <span class="elias-game__side-clue-name">{{ clueGiverName }}</span>
          </p>
          <p v-else class="elias-game__side-wait">תור הקבוצה הכחולה — ממתינים</p>
        </div>
        <ul class="elias-game__roster">
          <li
            v-for="p in teamRed"
            :key="p.id"
            class="elias-game__roster-item"
            :class="{ 'elias-game__roster-item--clue': isClueGiverForTeam(p, 'red') }"
          >
            <span class="elias-game__avatar" aria-hidden="true">{{ avatarLetter(p.name) }}</span>
            <span class="elias-game__roster-name">{{ p.name }}</span>
            <span v-if="isClueGiverForTeam(p, 'red')" class="elias-game__clue-tag">מסביר עכשיו</span>
          </li>
        </ul>
      </aside>

      <div class="elias-game__main">
        <header class="elias-game__scores">
          <div class="elias-game__score elias-game__score--red">
            <span class="elias-game__label">אדום</span>
            <span class="elias-game__num">{{ game.scores.red }}</span>
          </div>
          <div class="elias-game__meta">
            <span>יעד: {{ room.settings.targetScore }}</span>
          </div>
          <div class="elias-game__score elias-game__score--blue">
            <span class="elias-game__label">כחול</span>
            <span class="elias-game__num">{{ game.scores.blue }}</span>
          </div>
        </header>

        <div v-if="game.phase === 'finished'" class="elias-game__winner">
          <p class="elias-game__winner-text">
           הקבוצה {{ winnerLabel }} ניצחה!
          </p>
          <button
            v-if="isMaster"
            type="button"
            class="elias-game__btn-lobby"
            @click.stop="onReturnToLobby"
          >
            חזרה ללובי
          </button>
        </div>

        <div v-else class="elias-game__board">
          <p class="elias-game__turn">
            תור הקבוצה: <strong>{{ currentTeamLabel }}</strong>
          </p>
          <p class="elias-game__clue">
            מסביר: <strong>{{ clueGiverName }}</strong>
          </p>

          <p v-if="game.turnPhase === 'awaiting_start' && !isClueGiver" class="elias-game__wait">
            המסביר ילחץ על «התחל את התור» כדי לראות את המילה ולהתחיל את הזמן.
          </p>

          <div v-if="isClueGiver" class="elias-game__clue-ui">
            <template v-if="game.turnPhase === 'awaiting_start'">
              <button type="button" class="btn-go" @click="onStartTurn">התחל את התור</button>
            </template>
            <template v-else-if="game.turnPhase === 'running'">
              <p class="elias-game__timer" aria-live="polite">נותרו: {{ timeLeftLabel }}</p>
              <p v-if="secretWord" class="elias-game__word">{{ secretWord }}</p>
              <p v-else class="elias-game__word-muted">טוען מילה…</p>
              <div class="elias-game__actions">
                <button type="button" class="btn-guess" @click="onWord('guessed')">נוחש</button>
                <button type="button" class="btn-pass" @click="onWord('pass')">פספוס</button>
              </div>
              <p class="elias-game__round-stats">
                סיבוב זה: ניחושים {{ game.guessedThisTurn }} · פספוסים {{ game.passThisTurn }}
              </p>
            </template>
          </div>

          <div v-if="!isClueGiver && game.turnPhase === 'running'" class="elias-game__spectator">
            <p class="elias-game__timer">זמן: {{ timeLeftLabel }}</p>
            <p class="elias-game__spectator-hint">המילה נסתרת מהמסביר בלבד.</p>
          </div>
        </div>
      </div>

      <aside
        class="elias-game__side elias-game__side--blue"
        :class="{ 'elias-game__side--turn-active': isSideTurnActive('blue') }"
        aria-label="קבוצה כחולה"
      >
        <h3 class="elias-game__side-title">קבוצה כחולה</h3>
        <p class="elias-game__side-score">{{ game.scores.blue }} נק׳</p>
        <div v-if="game.phase === 'playing'" class="elias-game__side-clue-box" aria-live="polite">
          <p v-if="game.currentTeam === 'blue'" class="elias-game__side-clue-line">
            <span class="elias-game__side-clue-label">מסביר עכשיו</span>
            <span class="elias-game__side-clue-name">{{ clueGiverName }}</span>
          </p>
          <p v-else class="elias-game__side-wait">תור הקבוצה האדומה — ממתינים</p>
        </div>
        <ul class="elias-game__roster">
          <li
            v-for="p in teamBlue"
            :key="p.id"
            class="elias-game__roster-item"
            :class="{ 'elias-game__roster-item--clue': isClueGiverForTeam(p, 'blue') }"
          >
            <span class="elias-game__avatar" aria-hidden="true">{{ avatarLetter(p.name) }}</span>
            <span class="elias-game__roster-name">{{ p.name }}</span>
            <span v-if="isClueGiverForTeam(p, 'blue')" class="elias-game__clue-tag">מסביר עכשיו</span>
          </li>
        </ul>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, inject, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  room: { type: Object, required: true },
  playerId: { type: String, required: true },
  isMaster: { type: Boolean, default: false },
  secretWord: { type: String, default: '' },
})

const emit = defineEmits(['startTurn', 'wordResult'])

const returnToLobbyAction = inject('eliasReturnToLobby', null)

const game = computed(() => props.room.game)
const now = ref(Date.now())

let tick = null
function startTick() {
  clearTick()
  tick = setInterval(() => {
    now.value = Date.now()
  }, 250)
}
function clearTick() {
  if (tick) {
    clearInterval(tick)
    tick = null
  }
}

watch(
  () => props.room.game?.turnPhase,
  (phase) => {
    if (phase === 'running') startTick()
    else clearTick()
  },
  { immediate: true },
)

onUnmounted(() => clearTick())

const teamRed = computed(() => props.room.players.filter((p) => p.team === 'red'))
const teamBlue = computed(() => props.room.players.filter((p) => p.team === 'blue'))

const isClueGiver = computed(() => props.room.game?.clueGiverId === props.playerId)

function isClueGiverForTeam(player, team) {
  const g = props.room.game
  if (!g || g.phase !== 'playing') return false
  if (g.currentTeam !== team) return false
  return player.id === g.clueGiverId
}

function isSideTurnActive(team) {
  const g = props.room.game
  return g?.phase === 'playing' && g.currentTeam === team
}

function avatarLetter(name) {
  const s = String(name || '?').trim()
  return s ? s[0].toUpperCase() : '?'
}

const clueGiverName = computed(() => {
  const id = props.room.game?.clueGiverId
  const p = props.room.players.find((x) => x.id === id)
  return p?.name || '—'
})

const currentTeamLabel = computed(() => (props.room.game?.currentTeam === 'red' ? 'אדומה' : 'כחולה'))

const winnerLabel = computed(() => (props.room.game?.winner === 'red' ? 'האדומה' : 'הכחולה'))

const timeLeftMs = computed(() => {
  const end = props.room.game?.turnEndsAt
  if (!end) return 0
  return Math.max(0, end - now.value)
})

const timeLeftLabel = computed(() => {
  const s = Math.ceil(timeLeftMs.value / 1000)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
})

function onStartTurn() {
  emit('startTurn')
}

function onWord(result) {
  emit('wordResult', result)
}

function onReturnToLobby() {
  if (typeof returnToLobbyAction === 'function') returnToLobbyAction()
}
</script>

<style scoped>
.elias-game {
  width: 100%;

  .elias-game__layout {
    display: grid;
    grid-template-columns: minmax(11rem, 15rem) minmax(0, 1fr) minmax(11rem, 15rem);
    gap: 1rem;
    align-items: stretch;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  .elias-game__side {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 0.75rem;
    border: 1px solid var(--clr-elias-border);
    background: var(--clr-elias-surface);
    min-height: 14rem;

    @media (max-width: 900px) {
      min-height: auto;
    }
  }

  .elias-game__side--red {
    border-color: var(--clr-team-red-muted);
    background: color-mix(in srgb, var(--clr-team-red-muted) 35%, var(--clr-elias-surface));
  }

  .elias-game__side--blue {
    border-color: var(--clr-team-blue-muted);
    background: color-mix(in srgb, var(--clr-team-blue-muted) 35%, var(--clr-elias-surface));
  }

  .elias-game__side--turn-active {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--prime-text) 12%, transparent);
  }

  .elias-game__side--red.elias-game__side--turn-active {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--clr-team-red) 45%, transparent),
      0 8px 24px color-mix(in srgb, var(--clr-team-red) 18%, transparent);
  }

  .elias-game__side--blue.elias-game__side--turn-active {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--clr-team-blue) 45%, transparent),
      0 8px 24px color-mix(in srgb, var(--clr-team-blue) 18%, transparent);
  }

  .elias-game__side-clue-box {
    padding: 0.65rem 0.75rem;
    border-radius: 0.5rem;
    background: color-mix(in srgb, var(--sec-bg) 88%, transparent);
    border: 1px solid var(--clr-elias-border);
  }

  .elias-game__side-clue-line {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .elias-game__side-clue-label {
    font-size: 0.72em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--sec-text);
  }

  .elias-game__side-clue-name {
    font-size: 1.05em;
    font-weight: 800;
    color: var(--prime-text);
    word-break: break-word;
  }

  .elias-game__side-wait {
    margin: 0;
    font-size: 0.88em;
    font-weight: 600;
    color: var(--sec-text);
    line-height: 1.4;
  }

  .elias-game__side-title {
    margin: 0;
    font-size: 1.15em;
    font-weight: 800;
    color: var(--prime-text);
  }

  .elias-game__side-score {
    margin: 0;
    font-size: 0.95em;
    color: var(--sec-text);
  }

  .elias-game__roster {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .elias-game__roster-item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.5rem;
    border-radius: 0.5rem;
    border: 1px solid transparent;
  }

  .elias-game__roster-item--clue {
    border-color: var(--prime-accent-500);
    background: var(--sec-bg);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--prime-accent-500) 40%, transparent);
  }

  .elias-game__avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--sec-accent-300);
    color: var(--prime-text);
    font-weight: 700;
    font-size: 0.85em;
    flex-shrink: 0;
  }

  .elias-game__roster-name {
    flex: 1;
    min-width: 0;
    color: var(--prime-text);
    font-weight: 600;
  }

  .elias-game__clue-tag {
    width: 100%;
    font-size: 0.72em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--sec-text);
  }

  .elias-game__main {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    min-width: 0;
  }

  .elias-game__scores {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 1rem;
    align-items: center;
    padding: 1rem;
    border-radius: 0.75rem;
    background: var(--clr-elias-surface);
    border: 1px solid var(--clr-elias-border);
  }

  .elias-game__score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem;
    border-radius: 0.65rem;
  }

  .elias-game__score--red {
    background: var(--clr-team-red-muted);
  }

  .elias-game__score--blue {
    background: var(--clr-team-blue-muted);
  }

  .elias-game__label {
    font-size: 0.9em;
    color: var(--sec-text);
  }

  .elias-game__num {
    font-size: 2rem;
    font-weight: 800;
    color: var(--prime-text);
  }

  .elias-game__meta {
    font-size: 0.85em;
    color: var(--sec-text);
    text-align: center;
  }

  .elias-game__winner {
    position: relative;
    z-index: 2;
    display: grid;
    gap: 1.25rem;
    justify-items: center;
    text-align: center;
    padding: 2rem;
    border-radius: 0.75rem;
    background: var(--sec-accent-300);
  }

  .elias-game__winner-text {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--prime-text);
  }

  .elias-game__btn-lobby {
    position: relative;
    z-index: 3;
    padding: 0.65rem 1.5rem;
    font-size: 1.05em;
    font-weight: 700;
    border: none;
    border-radius: 0.65rem;
    cursor: pointer;
    background: var(--clr-team-blue);
    color: var(--light-text);
  }

  .elias-game__board {
    display: grid;
    gap: 1rem;
  }

  .elias-game__turn,
  .elias-game__clue {
    margin: 0;
    color: var(--prime-text);
    font-size: 1.1em;
  }

  .elias-game__wait {
    margin: 0;
    color: var(--sec-text);
    line-height: 1.5;
  }

  .elias-game__clue-ui {
    display: grid;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 0.75rem;
    border: 1px solid var(--clr-elias-border);
    background: var(--sec-bg);
  }

  .elias-game__timer {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--prime-text);
  }

  .elias-game__word {
    margin: 0;
    font-size: 2rem;
    font-weight: 800;
    text-align: center;
    color: var(--prime-text);
  }

  .elias-game__word-muted {
    margin: 0;
    font-size: 1rem;
    font-weight: 500;
    text-align: center;
    color: var(--sec-text);
  }

  .elias-game__actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-go {
    padding: 0.75rem 1.5rem;
    font-size: 1.1em;
    font-weight: 700;
    border: none;
    border-radius: 0.65rem;
    cursor: pointer;
    background: var(--clr-team-blue);
    color: var(--light-text);
  }

  .btn-guess {
    padding: 0.65rem 1.25rem;
    font-size: 1em;
    font-weight: 600;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    background: var(--clr-team-red);
    color: var(--light-text);
  }

  .btn-pass {
    padding: 0.65rem 1.25rem;
    font-size: 1em;
    font-weight: 600;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    background: var(--prime-accent-500);
    color: var(--light-text);
  }

  .elias-game__round-stats {
    margin: 0;
    text-align: center;
    color: var(--sec-text);
    font-size: 0.95em;
  }

  .elias-game__spectator {
    padding: 1rem;
    border-radius: 0.65rem;
    background: var(--clr-elias-surface);
    border: 1px dashed var(--clr-elias-border);
  }

  .elias-game__spectator-hint {
    margin: 0.5rem 0 0;
    color: var(--sec-text);
    font-size: 0.95em;
  }
}
</style>
