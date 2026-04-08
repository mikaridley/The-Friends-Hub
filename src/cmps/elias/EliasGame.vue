<template>
  <section class="elias-game" dir="rtl">
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
        ניצחה הקבוצה {{ winnerLabel }}!
      </p>
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
  </section>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  room: { type: Object, required: true },
  playerId: { type: String, required: true },
  secretWord: { type: String, default: '' },
})

const emit = defineEmits(['startTurn', 'wordResult'])

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

const isClueGiver = computed(() => props.room.game?.clueGiverId === props.playerId)

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
</script>

<style scoped>
.elias-game {
  display: grid;
  gap: 1.5rem;
  padding-block: 1rem;

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
