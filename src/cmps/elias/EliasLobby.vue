<template>
  <section class="elias-lobby" dir="rtl">
    <header class="elias-lobby__header">
      <p class="elias-lobby__code">
        קוד חדר: <strong>{{ room.code }}</strong>
      </p>
      <p v-if="isMaster" class="elias-lobby__hint">אתה מנהל החדר — הגדר זמן וניקוד והתחל כשכולם מוכנים.</p>
    </header>

    <div v-if="isMaster" class="elias-lobby__settings">
      <label class="elias-lobby__field">
        <span>זמן לתור (שניות)</span>
        <input
          type="number"
          min="10"
          max="600"
          :value="room.settings.turnSeconds"
          @change="onSettingsTurn"
        />
      </label>
      <label class="elias-lobby__field">
        <span>ניקוד לניצחון</span>
        <input
          type="number"
          min="1"
          max="999"
          :value="room.settings.targetScore"
          @change="onSettingsTarget"
        />
      </label>
      <button type="button" class="btn-random" @click="onRandomize">חלוקה אקראית</button>
    </div>

    <div class="elias-lobby__zones">
      <div class="elias-lobby__zone elias-lobby__zone--wait">
        <h3 class="elias-lobby__zone-title">כניסה</h3>
        <ul class="elias-lobby__list">
          <li v-for="p in unassigned" :key="p.id" class="elias-lobby__player">
            <span class="elias-lobby__avatar" aria-hidden="true">{{ avatarLetter(p.name) }}</span>
            <span class="elias-lobby__name">{{ p.name }}</span>
            <span v-if="p.isMaster" class="elias-lobby__badge">מנהל</span>
          </li>
          <li v-if="unassigned.length === 0" class="elias-lobby__empty">אין שחקנים כאן</li>
        </ul>
      </div>

      <div class="elias-lobby__zone elias-lobby__zone--red">
        <h3 class="elias-lobby__zone-title">קבוצה אדומה</h3>
        <button
          type="button"
          class="btn-join btn-join--red"
          :disabled="!canPickTeam"
          @click="onJoinTeam('red')"
        >
          הצטרף לאדומים
        </button>
        <ul class="elias-lobby__list">
          <li v-for="p in teamRed" :key="p.id" class="elias-lobby__player">
            <span class="elias-lobby__avatar" aria-hidden="true">{{ avatarLetter(p.name) }}</span>
            <span class="elias-lobby__name">{{ p.name }}</span>
            <span v-if="p.isMaster" class="elias-lobby__badge">מנהל</span>
          </li>
        </ul>
      </div>

      <div class="elias-lobby__zone elias-lobby__zone--blue">
        <h3 class="elias-lobby__zone-title">קבוצה כחולה</h3>
        <button
          type="button"
          class="btn-join btn-join--blue"
          :disabled="!canPickTeam"
          @click="onJoinTeam('blue')"
        >
          הצטרף לכחולים
        </button>
        <ul class="elias-lobby__list">
          <li v-for="p in teamBlue" :key="p.id" class="elias-lobby__player">
            <span class="elias-lobby__avatar" aria-hidden="true">{{ avatarLetter(p.name) }}</span>
            <span class="elias-lobby__name">{{ p.name }}</span>
            <span v-if="p.isMaster" class="elias-lobby__badge">מנהל</span>
          </li>
        </ul>
      </div>
    </div>

    <footer v-if="isMaster" class="elias-lobby__footer">
      <button type="button" class="btn-start" @click="onStartGame">התחל משחק</button>
    </footer>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  room: { type: Object, required: true },
  playerId: { type: String, required: true },
})

const emit = defineEmits(['joinTeam', 'randomizeTeams', 'updateSettings', 'startGame'])

const isMaster = computed(() => props.room.players.find((p) => p.id === props.playerId)?.isMaster)

const teamRed = computed(() => props.room.players.filter((p) => p.team === 'red'))
const teamBlue = computed(() => props.room.players.filter((p) => p.team === 'blue'))
const unassigned = computed(() => props.room.players.filter((p) => !p.team))

const canPickTeam = computed(() => !!props.playerId)

function avatarLetter(name) {
  const s = String(name || '?').trim()
  return s ? s[0].toUpperCase() : '?'
}

function onJoinTeam(team) {
  emit('joinTeam', team)
}

function onRandomize() {
  emit('randomizeTeams')
}

function onSettingsTurn(ev) {
  const v = Number(ev.target.value)
  if (Number.isFinite(v)) emit('updateSettings', { turnSeconds: v })
}

function onSettingsTarget(ev) {
  const v = Number(ev.target.value)
  if (Number.isFinite(v)) emit('updateSettings', { targetScore: v })
}

function onStartGame() {
  emit('startGame')
}
</script>

<style scoped>
.elias-lobby {
  display: grid;
  gap: 1.5rem;
  padding-block: 1rem;

  .elias-lobby__header {
    display: grid;
    gap: 0.5rem;
  }

  .elias-lobby__code {
    margin: 0;
    font-size: 1.25em;
    color: var(--prime-text);

    strong {
      letter-spacing: 0.15em;
      font-family: ui-monospace, monospace;
    }
  }

  .elias-lobby__hint {
    margin: 0;
    color: var(--sec-text);
    font-size: 0.95em;
  }

  .elias-lobby__settings {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-end;
    padding: 1rem;
    border-radius: 0.75rem;
    background: var(--clr-elias-surface);
    border: 1px solid var(--clr-elias-border);
  }

  .elias-lobby__field {
    display: grid;
    gap: 0.35rem;
    font-size: 0.9em;
    color: var(--sec-text);

    input {
      min-width: 8rem;
      padding: 0.5rem 0.65rem;
      border-radius: 0.5rem;
      border: 1px solid var(--clr-elias-border);
      background: var(--sec-bg);
      color: var(--prime-text);
    }
  }

  .btn-random {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--clr-elias-border);
    background: var(--sec-bg);
    color: var(--prime-text);
    cursor: pointer;

    &:hover {
      border-color: var(--prime-accent-500);
    }
  }

  .elias-lobby__zones {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  .elias-lobby__zone {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 0.75rem;
    border: 1px solid var(--clr-elias-border);
    background: var(--clr-elias-surface);
    min-height: 12rem;
  }

  .elias-lobby__zone--red {
    border-color: var(--clr-team-red-muted);
  }

  .elias-lobby__zone--blue {
    border-color: var(--clr-team-blue-muted);
  }

  .elias-lobby__zone-title {
    margin: 0;
    font-size: 1.05em;
    color: var(--prime-text);
  }

  .btn-join {
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    border: none;
    cursor: pointer;
    font-weight: 600;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .btn-join--red {
    background: var(--clr-team-red);
    color: var(--light-text);
  }

  .btn-join--blue {
    background: var(--clr-team-blue);
    color: var(--light-text);
  }

  .elias-lobby__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .elias-lobby__player {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0;
  }

  .elias-lobby__avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    background: var(--sec-accent-300);
    color: var(--prime-text);
    font-weight: 700;
    font-size: 0.95em;
  }

  .elias-lobby__name {
    flex: 1;
    color: var(--prime-text);
  }

  .elias-lobby__badge {
    font-size: 0.75em;
    padding: 0.15rem 0.4rem;
    border-radius: 0.35rem;
    background: var(--sec-accent-300);
    color: var(--sec-text);
  }

  .elias-lobby__empty {
    color: var(--sec-text);
    font-size: 0.9em;
  }

  .elias-lobby__footer {
    display: flex;
    justify-content: center;
  }

  .btn-start {
    padding: 0.75rem 2rem;
    font-size: 1.1em;
    font-weight: 700;
    border: none;
    border-radius: 0.65rem;
    cursor: pointer;
    background: var(--prime-accent-500);
    color: var(--light-text);

    &:hover {
      filter: brightness(1.05);
    }
  }
}
</style>
