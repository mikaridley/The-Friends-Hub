# Elias game — architecture & phases

## Goal (what we understood)

- **Lobby:** Master creates room → code; others join with code; everyone sees **default avatar + chosen name**.
- **Teams:** Two groups (e.g. blue / red), unlimited players; **Join group** UI moves icon under that team; master can **random split** (roughly equal).
- **Settings (master):** Turn timer (default **1 min**), win score (default **25**).
- **Start:** Master starts; game assigns **first team** at random (e.g. red).
- **Turn flow:**
  - Pick **one random clue-giver** from the **active** team (who hasn’t “used” their slot unfairly — see rotation below).
  - Only the clue-giver sees a **Hebrew word** (voice on Discord — out of scope).
  - They click **Start the turn** → then word appears + **1 min** countdown.
  - **Guessed** / **Pass** per word; as many words as possible in the window.
  - **Score for that round:** `guessed − pass` (example: 5 guessed, 2 pass → **3** points for the team). Show totals on screen; first team to **target score** wins.
- **Alternation:** After red’s turn, **blue**; then red again, etc.
- **Rotation:** Within a team, players take turns as clue-giver so **nobody plays twice in a row** before others have had a turn (e.g. order R1→B1→R2→B2→R3→B3→R1… if 3v3). Exact rule to confirm with product owner if edge cases (uneven teams, someone leaves).

## Do we need a backend?

**Yes — a real-time server is required** for this design.

| Need | Why not “Vue only” or “static hosting”? |
|------|----------------------------------------|
| Same state for everyone | All clients need one **authoritative** room + game state. |
| WebSockets | Fits “everyone sees changes at the same time” better than polling. |
| **Secret word** | The Hebrew word must be sent **only** to the clue-giver’s session. If the word lived only in the browser, others could cheat via devtools or leaked props. The server picks the word and emits it **to one socket** (or one `userId` session). |
| Room codes & master | Server generates codes, tracks who is master, validates joins. |
| Fair timer | Prefer **server-side** turn end time (broadcast deadline) so clients only display it — reduces drift and arguments. |

**What we chose this over**

- **Firebase/Supabase realtime + server function** — valid; still a backend, good if you want managed DB/auth later.
- **Peer-to-peer only** — weak for secrecy, reconnects, and “one source of truth”; not recommended for this game.

## Suggested stack (fits Vue + rules)

- **Frontend:** Vue 3 + Vite (already in project). Plain CSS per `.cursor` rules: variables, nesting, no raw colors, themes.
- **Backend:** Node.js + **Socket.IO** (or `ws` + small protocol) — rooms, events, broadcast.
- **State:** MVP: **in-memory** rooms (restart clears games). Later: Redis/DB if you need persistence.
- **Words:** Hebrew list on **server** (JSON file or DB); server draws next word per turn.
- **Auth:**
  - **Guest:** random `guestId` + name in `localStorage`/`sessionStorage`, sent on connect.
  - **Signed-in users:** add when you pick a provider (Supabase, Firebase, Clerk, etc.); same socket layer, attach `userId` from JWT/session.

## Main socket / API concepts (high level)

- `createRoom` → `{ roomCode, masterId }`
- `joinRoom({ code, name, guestOrUser })` → roster update to all
- `updateTeams`, `randomizeTeams` (master)
- `updateSettings` (timer seconds, target score)
- `startGame` (master)
- `startTurn` (current clue-giver only — or master if you want master to force; you said clue-giver clicks start)
- Server → only clue-giver: `wordForTurn { word }`
- Server → all: `turnState` (team, clue-giver id, timer end timestamp, scores — **not** the word)
- `wordResult` { guessed | pass } from clue-giver
- `endTurn` when timer fires or master ends (if allowed)

## Phases (implementation order)

1. **Backend skeleton** — HTTP health + Socket.IO, room create/join, broadcast roster.
2. **Lobby UI** — code display, join form, name, placeholder avatars, team columns + join + master randomize.
3. **Game state machine** — teams, scores, whose turn, pick clue-giver + Hebrew word server-side.
4. **Clue-giver UI** — start turn, word, guessed/pass, local timer synced from server.
5. **Win condition** — target score; optional rematch.
6. **Auth** — guest first; then integrate real auth provider.

## Questions — answer before we code the next steps

1. **Uneven teams:** If red has 4 and blue has 2, is random-split still “as equal as possible”, and does rotation still follow the stricter rule above?
2. **Pass/guess edge cases:** If time runs out mid-word, count as pass or discard?
3. **Hebrew words:** Do you provide a file, or should we start with a small built-in list and make it easy to replace?
4. **Hosting:** Where do you want the Node server to run (VPS, Railway, Render, Fly.io, etc.) — affects env vars and WebSocket config.

---

**Open item:** Project rules mention a **serviceLayer** skill for services; when we implement the Vue client, we should align API/socket calls with that pattern if the skill exists in the repo.
