# RLstats

A web platform for managing Rocket League tournaments and tracking game statistics.
Built for COMP306 — Postgres + Express + React.

## Architecture

```
┌──────────────────┐   /api/*    ┌──────────────────┐   pg     ┌──────────────────┐
│  React + Vite    │ ──────────► │  Express (Node)  │ ───────► │  Postgres 16     │
│  localhost:5173  │             │  localhost:5001  │          │  localhost:5432  │
└──────────────────┘             └──────────────────┘          └──────────────────┘
       frontend                         backend                        docker
```

- **`backend/`** — Node.js + Express 5 + `pg`, JWT auth, REST API on port 5001.
- **`frontend/`** — React 18 + Vite 5 + Tailwind (CDN) + React Router, dev server on port 5173 with a `/api` proxy to the backend.
- **`database/`** — `schema.sql`, `seed.sql`, `advancedqueries.sql` (the 5 advanced queries the backend exposes as endpoints).
- **`docker-compose.yml`** — Postgres container, auto-loads the schema + seed on first boot.

## Prerequisites

- **Docker Desktop** (for Postgres)
- **Node.js 18+** and **npm**
- macOS users: **disable AirPlay Receiver** or accept that the backend runs on port 5001 (not 5000) — AirPlay squats on port 5000 and returns 403 to non-AirPlay traffic.

## Quick start

```bash
# 1. Database
cp backend/.env.example backend/.env          # set a real DB_PASSWORD
docker compose --env-file backend/.env up -d  # Postgres on :5432, auto-seeded

# 2. Backend
cd backend
npm install
npm run dev                                   # http://localhost:5001

# 3. Frontend (in a new terminal)
cd frontend
npm install
npm run dev                                   # http://localhost:5173
```

Open <http://localhost:5173> and log in.

## Seed users

The seed data ships with five users. Passwords are stored in plain text in `APP_USER.password` to match the ER diagram exactly — this is **not** production practice, only for the assignment.

| Username | Password           | Admin? |
| -------- | ------------------ | ------ |
| Evrim    | SoccerCar@2358     | ✅     |
| Hakan    | Psswd&&3457        |        |
| Leyla    | 478018476@         |        |
| Rodrigo  | RocketLeagueNo1Fan |        |
| Ted      | Password123        |        |

Register a new user from the Login screen, or promote one to admin manually:

```sql
UPDATE APP_USER SET is_admin = TRUE WHERE username = 'yourname';
```

## Database — detailed

### Configure

`backend/.env` (gitignored, copied from `.env.example`):

```
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rl_stats
DB_USER=postgres
DB_PASSWORD=<your_password>
JWT_SECRET=<long_random_string>
JWT_EXPIRES_IN=7d
```

### Start

```bash
docker compose --env-file backend/.env up -d
```

On **first** boot the container runs:

1. `database/schema.sql` — drops + recreates all 11 tables
2. `database/seed.sql` — inserts the seed data (5 users, 24 players, 8 teams, 3 tournaments, 5 arenas, 20 matches, 120 player-match-stats rows, etc.)

These scripts only run when the data volume is empty.

### Useful commands

```bash
docker compose logs -f postgres                 # tail container logs
docker compose down                             # stop, keep data
docker compose down -v                          # stop AND wipe data (next start re-seeds)
docker exec -it rl_stats_postgres psql -U postgres -d rl_stats   # interactive psql
```

### Reset the data without rebuilding the container

```bash
docker exec -i rl_stats_postgres psql -U postgres -d rl_stats < database/schema.sql
docker exec -i rl_stats_postgres psql -U postgres -d rl_stats < database/seed.sql
```

## Backend — detailed

```bash
cd backend
npm install
npm run dev      # nodemon, restarts on file changes
npm start        # plain node, no auto-reload
```

The 5 advanced SQL queries from the project report are kept in `database/advancedqueries.sql` (one query per `-- name: <slug>` block) and loaded at startup by `backend/src/queries.js` — single source of truth between the report and the running API.

### Endpoint summary

Public:

- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/players`, `GET /api/players/:id`
- `GET /api/teams`, `GET /api/teams/:id`
- `GET /api/tournaments`, `GET /api/tournaments/:id`
- `GET /api/arenas`
- `GET /api/matches?tournament_id=&arena_id=&stage=`, `GET /api/matches/:id`
- `GET /api/matches/scores` ← **advanced query 5**
- `GET /api/stats/top-scorers` ← **advanced query 1**
- `GET /api/stats/top-teams-by-matches` ← **advanced query 2**
- `GET /api/stats/fav-teams-leaderboard` ← **advanced query 3**
- `GET /api/stats/top-tournament` ← **advanced query 4**

Auth required (`Authorization: Bearer <token>`):

- `GET /api/auth/me`
- `GET/POST/DELETE /api/users/me/fav-players[/:player_id]`
- `GET/POST/DELETE /api/users/me/fav-teams[/:team_id]`

Admin only (auth + `is_admin = true`):

- `POST` + `DELETE` for `/api/{players,teams,tournaments,arenas,matches}`
- `POST /api/players/:id/plays-for` + composite `DELETE`
- `POST /api/matches/:id/plays-as` + composite `DELETE`
- `POST /api/matches/:id/stats` + composite `DELETE`

Deleting a match cascades over `PLAYS_AS` + `PLAYER_MATCH_STATS` inside a transaction. All other deletes refuse to drop rows that other tables still reference (FK guard) and return `409` with a clear message.

## Frontend — detailed

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173, with /api proxied to :5001
npm run build        # production build into frontend/dist/
npm run preview      # serve the production build locally
```

### Pages

| Route                | What it does                                                       |
| -------------------- | ------------------------------------------------------------------ |
| `/`                  | All 5 leaderboards (the advanced queries)                          |
| `/login`             | Combined login + register                                          |
| `/players`           | Grid of players, searchable                                        |
| `/players/:id`       | Player profile, career stats, team history, favorite ★ button      |
| `/teams`             | Grid of teams (left border colored by region)                      |
| `/teams/:id`         | Team profile, stats, current roster, favorite ★ button             |
| `/tournaments`       | List of tournaments                                                |
| `/tournaments/:id`   | Tournament detail with its matches                                 |
| `/matches`           | Match list, filterable by tournament / arena / stage               |
| `/matches/:id`       | Match detail, blue/orange teams, per-player stats with MVP markers |
| `/favorites`         | Manage favorite players + teams (auth required)                    |
| `/admin`             | Full CRUD for every entity (admin only)                            |

### Auth

The frontend stores the JWT in `localStorage` under `rlstats_token`. `src/lib/api.js` attaches `Authorization: Bearer <token>` to every request automatically. On boot, `AuthProvider` calls `/api/auth/me` to restore the user; if the token is invalid it's silently cleared.

## Troubleshooting

**`403 Forbidden` on every `/api/*` call** — macOS AirPlay Receiver is on port 5000. We already moved the backend to 5001; make sure your `backend/.env` has `PORT=5001` and your `frontend/vite.config.js` proxies to `http://localhost:5001`.

**`EADDRINUSE` on port 5001 or 5173** — find and kill the process:

```bash
lsof -i :5001
kill -9 <pid>
```

**Backend can't connect to Postgres** — check the container is up (`docker compose ps`) and that `DB_PASSWORD` in `backend/.env` matches what you passed to `docker compose up`.

**Login returns 401 for a seed user** — make sure you applied `seed.sql`. If you registered a new user before the seed ran, the `user_id` sequence may collide. Easiest fix: `docker compose down -v && docker compose --env-file backend/.env up -d`.

**Schema changed and the container won't pick it up** — init scripts only run on an empty data volume. Run `docker compose down -v` then `up -d` to re-init.

## Project structure

```
rl-stats-backend/
├── README.md
├── docker-compose.yml
├── backend/
│   ├── package.json
│   ├── .env.example                  # copy to .env, edit secrets
│   └── src/
│       ├── app.js                    # entry, mounts routes
│       ├── db.js                     # pg Pool
│       ├── queries.js                # loads advancedqueries.sql at startup
│       ├── middleware/
│       │   ├── auth.js               # JWT verify, requireAdmin
│       │   └── error.js              # 404 + error handler
│       └── routes/
│           ├── auth.js               # /register, /login, /me
│           ├── players.js
│           ├── teams.js
│           ├── tournaments.js
│           ├── arenas.js
│           ├── matches.js
│           ├── favorites.js
│           └── stats.js              # the 4 leaderboard queries
├── database/
│   ├── schema.sql                    # 11 tables, FKs, CHECKs
│   ├── seed.sql                      # sample data
│   └── advancedqueries.sql           # 5 named queries
└── frontend/
    ├── package.json
    ├── vite.config.js                # /api → http://localhost:5001
    ├── index.html                    # Tailwind config inline
    ├── public/                       # images served at root
    ├── comp306ProjectDemo.html       # legacy mockup, reference only
    └── src/
        ├── main.jsx
        ├── App.jsx                   # routes
        ├── index.css                 # scrollbar, autofill fix, .rl-input, .purple-glow
        ├── lib/
        │   ├── api.js                # fetch() wrapper, attaches JWT
        │   └── auth.jsx              # AuthProvider context
        ├── components/
        │   ├── Nav.jsx
        │   └── ProtectedRoute.jsx
        └── pages/                    # one component per route
```

## Team

Çağlar Çoban · Poyraz Pala · Arda Robin Özkeskin · Ayberk Özcan · Evrim Enüstün · Oğuz Kağan Hitit
