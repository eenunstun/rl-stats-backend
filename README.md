# Rocket League Stats

Rocket League Stats is a PostgreSQL, Express, and HTML/JavaScript application for tracking Rocket League players, teams, tournaments, matches, match stats, leaderboards, and user favorites. It includes an admin panel for managing data and a user panel for browsing leaderboards, advanced query showcases, favorite players, favorite teams, and recent match history.

## Features

- Player, team, tournament, arena, and match management
- Tournament and non-tournament match recording
- Per-player match stats with goals, assists, saves, shot accuracy, and MVP status
- Player, team, tournament, and match leaderboards
- User favorite player and favorite team tracking
- Favorite player/team last-match dashboard cards
- Advanced SQL query showcase on the user dashboard
- Admin-only create, update, and delete workflows
- Seed data for development and demos

## Prerequisites

- Node.js 18 or newer
- PostgreSQL 14 or newer
- Git
- A terminal with access to `psql`, or the backend reset script described below

## Repository Setup

```powershell
git clone https://github.com/eenunstun/rl-stats-backend.git
cd rl-stats-backend
git checkout final-setup
cd backend
npm install
```

If PowerShell blocks `npm` scripts, use `npm.cmd install` or run commands from Command Prompt.

## Database Setup

Create the PostgreSQL database:

```sql
CREATE DATABASE rl_stats;
```

Create `backend/.env` with your local credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rl_stats
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=change_this_for_real_use
JWT_EXPIRES_IN=7d
PORT=5000
```

From `backend`, reset schema and seed data:

```powershell
node scripts\reset-db.js
```

The reset script loads `database/schema.sql` and then `database/seed.sql`. If `psql` is available on your PATH, you can also run the SQL files manually from the repository root:

```powershell
psql -U postgres -d rl_stats -f database\schema.sql
psql -U postgres -d rl_stats -f database\seed.sql
```

## Starting The Backend

From `backend`:

```powershell
npm run dev
```

For a non-watch server:

```powershell
npm start
```

The backend runs at:

```text
http://localhost:5000
```

## API Verification

Health check:

```text
GET http://localhost:5000/api/health
```

Useful read endpoints:

```text
GET http://localhost:5000/api/players
GET http://localhost:5000/api/teams/leaderboard
GET http://localhost:5000/api/matches
GET http://localhost:5000/api/matches/scores
GET http://localhost:5000/api/stats/top-scorers
```

Admin endpoints require a bearer token from login.

## Frontend Setup

The frontend is a static HTML application:

```text
frontend/comp306ProjectDemo.html
```

Open it in a browser after starting the backend. The frontend expects the backend API at `http://localhost:5000/api`.

## Authentication

Seed data includes an admin account:

```text
Username: Evrim
Password: Nebula!47Crank
```

Admin users can create and delete players, teams, tournaments, matches, and player match stats. Regular users can browse the user panel and update their own favorite player/team.

## Project Structure

```text
backend/
  src/
    app.js                 Express app and route mounting
    db.js                  PostgreSQL connection pool
    middleware/            Auth and error middleware
    routes/                API routes for auth, players, teams, matches, tournaments, stats, favorites
    queries.js             Named SQL query loader
  scripts/reset-db.js      Local database reset helper
database/
  schema.sql               Database tables and constraints
  seed.sql                 Development/demo data
  advanced_queries.sql     Named advanced SQL queries
frontend/
  comp306ProjectDemo.html  User panel and admin panel UI
```

## Troubleshooting

- `psql is not recognized`: Install PostgreSQL command-line tools or add the PostgreSQL `bin` directory to PATH. You can use `node scripts\reset-db.js` instead.
- `npm.ps1 cannot be loaded`: PowerShell script execution is restricted. Use `npm.cmd run dev`, Command Prompt, or `node scripts\reset-db.js` for database reset.
- `ECONNREFUSED` or database login errors: Check `backend/.env`, confirm PostgreSQL is running, and verify `DB_NAME`, `DB_USER`, and `DB_PASSWORD`.
- Port already in use: Change `PORT` in `backend/.env`, then update `API_BASE` in `frontend/comp306ProjectDemo.html` if needed.
- Empty frontend data: Start the backend first, reset the database, then refresh the browser.
- Auth failures: Log in again so the frontend stores a fresh JWT token.

## Disclaimer

This project was created solely for educational and portfolio purposes as part of a university coursework project. Any references to Rocket League, professional players, teams, tournaments, or arenas are used for identification and demonstration purposes only. All match results, statistics, and database records are fictional unless otherwise stated.
Rocket League is a trademark of Epic Games, Inc. This project is not affiliated with, endorsed by, sponsored by, or associated with Epic Games, Inc. or Rocket League Esports.

## Contributors

- Evrim Enüstün
- Oğuz Kağan Hitit
- Ayberk Özcan
- Arda Robin Özkeskin
- Çağlar Çoban
- Poyraz Pala
