# Sckoll — Live Sports & Match Streaming Platform

> **Every Match. Every League. Ultra HD Zero-Lag Streams.**
>
> Sckoll is a next-generation live sports match streaming network delivering multi-server adaptive HLS video feeds, real-time match tracking (scores, commentary, tactical pitch formations, statistics), interactive live fan chat with floating emoji reactions, official league standings, and video highlight recaps.

---

## Architecture Overview

```
                   ┌───────────────────────────────────────┐
                   │    Sckoll Web Client (Next.js 16)     │
                   │    App Router • Turbopack • Hls.js    │
                   └──────────────────┬────────────────────┘
                                      │
               ┌──────────────────────┴──────────────────────┐
               ▼                                             ▼
┌─────────────────────────────┐               ┌─────────────────────────────┐
│      Fastify 5 REST API     │               │  Multi-Server Video CDNs    │
│  - /v1/matches (Live ticks) │               │  - Server 1: 1080p Ultra HD │
│  - /v1/matches/:id/streams  │               │  - Server 2: 60fps Stadium  │
│  - /v1/matches/:id/chat     │               │  - Server 3: Mobile 720p    │
│  - /v1/leagues/standings    │               │  - Server 4: International  │
│  - Live Simulation Engine   │               └─────────────────────────────┘
└──────────────┬──────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
┌──────────────────┐ ┌──────────────────┐
│  PostgreSQL 16   │ │     Redis 7      │
│  Drizzle ORM     │ │  Session & Cache │
└──────────────────┘ └──────────────────┘
```

- **Frontend**: Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · Hls.js · Lucide Icons
- **Backend**: Fastify 5 · TypeScript · Drizzle ORM
- **Database & Cache**: PostgreSQL 16 (matches, streams, events, lineups, chat, standings) · Redis
- **Streaming Protocols**: Adaptive HTTP Live Streaming (HLS `.m3u8`), MP4 direct fallback, iframe embeds
- **Real-Time Engine**: Background match simulation daemon running live clock ticks, dynamic viewer jitter, and automated goal/event feeds.

---

## Key Features

1. **Live Match Streaming Hub (`/`)**
   - Marquee live hero match banner with dynamic scores, minute ticker, and instant 4K playback.
   - Sports filter pills: Football / Soccer, Basketball (NBA), Tennis, Combat Sports (UFC/MMA), Motorsport (F1).
   - Fast league shortcuts: Premier League, UEFA Champions League, La Liga, Serie A, Bundesliga, NBA.
   - Match status tabs: *Live Now*, *Today*, *Upcoming*, and *Replays*.
   - Responsive match cards with team crests, live scores, viewer counts, and stream CTAs.

2. **Watch Theater Experience (`/watch/[id]`)**
   - **Multi-Server Selector**: Switch between 1080p Ultra HD, 60fps Low-Latency, Mobile Data Saver (720p), and International commentary feeds.
   - **Cinema / Lights Off Mode**: Dim background overlay for a distraction-free stadium feel.
   - **Theater Mode**: Expand player to full browser width with a single click.
   - **Interactive Data Tabs**:
     - *Timeline & Commentary*: Real-time goals (with assist credits), cards, and substitutions.
     - *Tactical Lineups*: Visual football pitch representation with confirmed starting XI, numbers, positions, and managers.
     - *Match Stats*: Live possession percentage bars, shots on target, corners, fouls, and saves.
     - *Head-to-Head & Form*: 5-match form guide (W-D-L) and historical clash history.

3. **Live Fan Chat & Emoji Reactions**
   - Real-time live fan chat room per match with customizable guest nicknames and badges (FAN, VIP, MOD, PRO).
   - Interactive floating emoji reactions: ⚽ Goal, 🔥 Fire, 👏 Bravo, 🐐 GOAT, 😱 Shock, ❤️ Love.
   - Live viewer count ticker with realistic crowd dynamics.

4. **Fixtures & Schedule (`/schedule`)**
   - Full fixture browser across sports and leagues with kickoff times converted to the user's local timezone.

5. **Official League Standings (`/standings`)**
   - Full league tables with Rank, Played, Won, Drawn, Lost, Goals For/Against, Goal Difference, Points, and 5-match form guide badges.

6. **Highlights & Goal Clips (`/highlights`)**
   - Post-match video recaps, goal highlights, and top plays of the week with embedded video modal.

---

## API Documentation

| Endpoint | Method | Description |
|---|---|---|
| `/v1/sports` | `GET` | List sports categories with active live match counts |
| `/v1/matches` | `GET` | Query matches filtered by `sport`, `league`, `status`, or search query `q` |
| `/v1/matches/:id` | `GET` | Full match details including multi-server streams, events, lineups, and stats |
| `/v1/matches/:id/streams` | `GET`, `POST` | List or register stream sources |
| `/v1/matches/:id/chat` | `GET`, `POST` | Fetch or submit live match chat messages |
| `/v1/matches/:id/reactions`| `POST` | Post live emoji reactions (goal, fire, clap, goat, shock, heart) |
| `/v1/leagues` | `GET` | List sports leagues and tournaments |
| `/v1/leagues/:id/standings`| `GET` | Standings table for a league |
| `/v1/highlights` | `GET` | Video highlights and goal clips |
| `/v1/auth/signup` | `POST` | Fan account registration with favorite team |
| `/v1/auth/signin` | `POST` | Fan account login |
| `/health` & `/readyz` | `GET` | Service and database dependency health status |

---

## Running Locally

### 1. Start Database & Redis
```bash
docker compose up -d db redis
```

### 2. Run Database Seed
```bash
cd backend
npm run db:seed
```

### 3. Run Backend API
```bash
cd backend
npm run dev
```

### 4. Run Frontend
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to start watching live matches.

---

## Test Suites

- **Backend Tests (Vitest)**: 13 suites, 70 passing tests
  ```bash
  cd backend && npm test
  ```
- **Frontend Tests (Vitest & Testing Library)**: 6 suites, 23 passing tests
  ```bash
  npm test
  ```
- **Production Build**: Verified with Next.js Turbopack
  ```bash
  npm run build
  ```
