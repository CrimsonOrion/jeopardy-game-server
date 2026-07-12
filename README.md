# Jeopardy! Game Server

Jeopardy! game server based on [Things with Buzzers](https://github.com/andygrunwald/things-with-buzzers-jeopardy)

## How it works

This is an Express app serving an AngularJS 1.x single-page app (`ui-router`), with real-time
state synced across clients over Socket.io. There's no database — game state lives in memory
on the server for the life of the process, and a finished game is written out to a JSON file
under `games/`.

- **Views** (`views/*.pug`) render the SPA shell (`layout.pug` + `index.pug`) and the partial
  templates the client fetches as it navigates (`views/partials/*.pug`, served via
  `GET /partials/:name`).
- **Game content** (seasons, games, categories, clues) doesn't live in this app. It's fetched
  from another server (configured via `RESOURCE_SERVER` in `.env`) and proxied through this
  app's `/api/*` routes — see [jeopardy-api-server](../jeopardy-api-server) for the actual
  content source.
- **Socket.io** (`routes/socket.js`) is what keeps the host screen and the shared board screen
  in sync in real time — starting a game, moving between rounds, opening/closing a clue, and
  ending a game all broadcast over sockets rather than HTTP.
- **Auth**: the `/api/*` routes (which is how any client, including the seasons/admin page,
  actually gets game content) are protected with HTTP Basic Auth, configured via `AUTH_USER` /
  `AUTH_PASS` in `.env`.

### Typical flow for running a game

1. The host opens `/admin`, which triggers the browser's Basic Auth prompt, then shows the
   list of seasons.
2. The host picks a season, then a game within it — landing on that game's control view
   (`/games/:id`), which shows categories/clue counts and a **Start Game** button.
3. The host opens `/board` on a second screen/projector — this is the shared display
   contestants see. Before a game starts, it just shows an audio/video sound-check screen.
4. Clicking **Start Game** broadcasts the first round to every connected `/board` client.
   The host clicks into clues from the control view; each clue opens as a modal on both the
   host and the board screens, synced over sockets.
5. **End Round** advances Jeopardy → Double Jeopardy → Final Jeopardy → game over. On game
   over, the final state is written to `games/<game-id>-<timestamp>.json`.

## Configuration (`.env`)

Copy `.env.example` to `.env` and set:

| Variable          | Purpose                                                                 |
|--------------------|-------------------------------------------------------------------------|
| `PORT`             | Port this server listens on (default `3000`)                            |
| `RESOURCE_SERVER`  | `host:port` of the server that provides `/game-content/*` JSON          |
| `AUTH_USER`        | Username required to access `/api/*` (and therefore `/admin`)         |
| `AUTH_PASS`        | Password required to access `/api/*`                                    |

On a hosted deployment (e.g. cPanel's "Setup Node.js App"), these need to be set as actual
environment variables in that interface, since `.env` is git-ignored and won't be deployed
by itself.

## Endpoints

### Getting to admin

The seasons/admin page lives at:

```
/admin
```

Visiting it will prompt for the `AUTH_USER` / `AUTH_PASS` credentials (HTTP Basic Auth) before
it can load the seasons list — the prompt is triggered by the underlying `GET /api/seasons`
call, which is what's actually protected.

From there:
- Click a season → `/seasons/:id` — lists that season's games.
- Click a game → `/games/:id` — the host control view for that game (Start Game, End Round,
  Reset Game, and clue selection all happen here).

### Other client routes

| Route              | Purpose                                                              |
|---------------------|------------------------------------------------------------------------|
| `/admin`          | Seasons list (protected, see above)                                   |
| `/seasons/:id`    | Games within a season                                                 |
| `/games/:id`      | Host control view for a specific game                                 |
| `/board`          | Shared board display (contestant-facing screen)                       |

Anything else falls back to `/board` by default.

### HTTP routes (server-side)

| Route                  | Protected? | Purpose                                              |
|--------------------------|:----------:|--------------------------------------------------------|
| `GET /`                 | No         | Serves the SPA shell                                    |
| `GET /partials/:name`   | No         | Serves a Pug partial for `ui-router` (e.g. `board`, `game`, `seasons`, `season`, `gameclue`, `boardclue`) |
| `GET /api/seasons`      | Yes        | List of seasons (proxied from `RESOURCE_SERVER`)         |
| `GET /api/seasons/:id`  | Yes        | Games within a season (proxied)                          |
| `GET /api/games/:id`    | Yes        | Full game content — categories, clues (proxied)          |
| `GET *`                 | No         | Catch-all, serves the SPA shell (client-side routing)    |

### Socket.io events

Used internally by the host and board views — not something you'd call directly, but useful
for understanding what's actually keeping screens in sync:

| Event         | Direction        | Purpose                                                          |
|----------------|-------------------|--------------------------------------------------------------------|
| `game:init`    | client → server → client | Host view requests current state for a game on load       |
| `game:start`   | client → server → all    | Starts the game, kicks off the Jeopardy round               |
| `round:end`    | client → server → all    | Advances J → DJ → FJ → end, writes final state to `games/` on end |
| `board:init`   | client → server → client | Board view requests current game state on load             |
| `clue:start`   | client → server → others | Opens a clue modal on the board (and other host views)      |
| `clue:daily`   | client → server → others | Flags a clue as a Daily Double                              |
| `clue:end`     | client → server → others | Closes the clue modal, updates scores                       |
