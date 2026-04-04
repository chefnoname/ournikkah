# Backend Documentation — OurNikkah Server

## Overview

The backend is a **Node.js + Express 5 + PostgreSQL** API server located in `server/`. It uses **Drizzle ORM** for type-safe database access and **express-session** with `connect-pg-simple` for session storage. It lives in the same monorepo as the Expo frontend.

---

## Quick Start

```bash
# 1. Create the PostgreSQL database
createdb ournikkah

# 2. Configure environment variables
#    Edit server/.env — set DATABASE_URL and SESSION_SECRET

# 3. Install server dependencies
cd server && npm install

# 4. Push the schema to the database
npm run db:push

# 5. Start both frontend + backend (from project root)
cd .. && npm run dev
```

The `npm run dev` script (root) runs Expo web and the server concurrently.  
Or start the server alone: `cd server && npm run dev`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express 5 |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Sessions | express-session + connect-pg-simple |
| Passwords | bcrypt (12 rounds) |
| Validation | Zod |
| Auth | Session cookies (registered users) + X-Guest-Token header (anonymous guests) |

---

## Project Structure

```
server/
├── package.json              # Dependencies + scripts
├── tsconfig.json             # TypeScript config (strict)
├── drizzle.config.ts         # Drizzle Kit config (migrations, studio)
├── .env                      # Environment variables (not committed)
└── src/
    ├── index.ts              # Express app — middleware, route mounting, error handler
    ├── seed.ts               # Vendor directory seed data (10 venues + 12 vendors)
    ├── db/
    │   ├── schema.ts         # All Drizzle table definitions (10 tables)
    │   └── index.ts          # Database connection (postgres-js driver)
    ├── middleware/
    │   └── auth.ts           # resolveAuth, requireAuth, requireUser, requireWorkspaceAccess
    └── routes/
        ├── auth.ts           # POST /register, /login, /logout — GET /user
        ├── guest.ts          # POST /guest/start — PUT /guest/onboarding — GET /guest/workspace
        ├── workspaces.ts     # Full workspace CRUD + settings, invite, members, summary
        ├── directory.ts      # GET /directory — GET /directory/:id — seed handler
        ├── saved-vendors.ts  # Saved vendor list, save, remove, status update
        ├── budget.ts         # Budget item CRUD
        ├── guest-invites.ts  # Wedding guest list CRUD
        ├── notes.ts          # Notes CRUD
        └── invite.ts         # Validate + accept workspace invite codes
```

---

## Environment Variables (`server/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | — | Secret for signing session cookies |
| `PORT` | No | `3000` | Server port |
| `CORS_ORIGIN` | No | `http://localhost:8081` | Allowed CORS origin (Expo dev server) |
| `NODE_ENV` | No | — | Set to `production` for secure cookies |

---

## NPM Scripts (`server/package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `tsx watch src/index.ts` | Start dev server with auto-reload |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/index.js` | Run compiled production build |
| `typecheck` | `tsc --noEmit` | Type-check without emitting |
| `db:generate` | `drizzle-kit generate` | Generate migration files |
| `db:push` | `drizzle-kit push` | Push schema directly to database |
| `db:studio` | `drizzle-kit studio` | Open Drizzle Studio (DB GUI) |

Root-level scripts added to `package.json`:

| Script | Description |
|--------|-------------|
| `server:dev` | Start server only (`cd server && npm run dev`) |
| `dev` | Start Expo web + server concurrently |

---

## Database Schema (10 tables)

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| email | varchar(255) UNIQUE | Lowercased on insert |
| password_hash | varchar(255) | bcrypt, 12 rounds |
| created_at | timestamp | |

### `workspaces`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| name | varchar(255) | |
| user_name | varchar(255) | Nullable — set during onboarding |
| partner_name | varchar(255) | Nullable |
| base_location | varchar(255) | Nullable |
| owner_id | integer FK → users | Nullable (null for guest workspaces) |
| has_nikah | boolean | Default false |
| has_walima | boolean | Default false |
| onboarding_completed | boolean | Default false |
| current_stage | varchar(50) | Default 'planning' |
| nikah_date | varchar(50) | Nullable — can be exact date or "Spring 2027" |
| walima_date | varchar(50) | Nullable |
| budget_range | varchar(50) | Nullable |
| guest_count | varchar(50) | Nullable |
| total_budget | numeric(12,2) | Default 0 |
| created_at | timestamp | |

### `guest_tokens`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| token | varchar(64) UNIQUE | crypto.randomBytes(32).toString('hex') |
| workspace_id | integer FK → workspaces | CASCADE delete |
| created_at | timestamp | |
| expires_at | timestamp | 30 days from creation |

### `workspace_members`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| workspace_id | integer FK → workspaces | CASCADE |
| user_id | integer FK → users | CASCADE |
| role | varchar(20) | 'owner' or 'member' |
| joined_at | timestamp | |

### `workspace_invites`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| workspace_id | integer FK → workspaces | CASCADE |
| code | varchar(32) UNIQUE | crypto.randomBytes(16).toString('hex') |
| created_at | timestamp | |
| expires_at | timestamp | Nullable |

### `vendor_items` (global directory catalog)
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| section | varchar(20) | 'venue' or 'vendor' |
| vendor_category | varchar(50) | e.g. 'Banquet Hall', 'Photographer' |
| title | varchar(255) | |
| url, location, price_range | varchar | Nullable |
| image_urls | text[] | |
| status | varchar(20) | Default 'active' |
| source | varchar(50) | Default 'seed' |
| description, bio | text | Nullable |
| specialty, capacity | varchar | Nullable |
| sister_friendly, parking, disability_accessible | boolean | Nullable |
| features, amenities | text[] | |
| contact_email, contact_phone | varchar | Nullable |
| created_at, updated_at | timestamp | |

### `saved_vendors`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| workspace_id | FK → workspaces | CASCADE |
| vendor_item_id | FK → vendor_items | CASCADE |
| contact_status | varchar(20) | Default 'saved' — values: saved, contacted, booked |
| is_finalized | boolean | Default false — auto-set true when status = 'booked' |
| created_at | timestamp | |

### `budget_items`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| workspace_id | FK → workspaces | CASCADE |
| category | varchar(100) | |
| amount | numeric(12,2) | Default 0 |
| notes | text | Nullable |
| created_at | timestamp | |

### `guest_invites` (wedding guest list)
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| workspace_id | FK → workspaces | CASCADE |
| guest_name | varchar(255) | |
| rsvp_status | varchar(20) | Default 'pending' — values: pending, attending, declined |
| created_at | timestamp | |

### `notes`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| workspace_id | FK → workspaces | CASCADE |
| title | varchar(255) | |
| content | text | |
| updated_by_email | varchar(255) | Nullable |
| created_at, updated_at | timestamp | |

---

## Authentication Model

The server uses a **dual-auth** system:

### 1. Session Cookies (Registered Users)
- `POST /api/register` or `POST /api/login` sets `req.session.userId`
- `express-session` stores sessions in PostgreSQL via `connect-pg-simple`
- Cookie name: `connect.sid`, httpOnly, 30-day expiry
- Frontend sends `credentials: 'include'` on every request

### 2. Guest Tokens (Anonymous Users)
- `POST /api/guest/start` generates a 64-char hex token + creates a workspace
- Token is stored in `guest_tokens` table with 30-day expiry
- Frontend stores it in AsyncStorage and sends as `X-Guest-Token` header
- Server validates token on every request via `resolveAuth` middleware

### Middleware Chain
1. **`resolveAuth`** — runs on every request, populates `req.user` and/or `req.guestWorkspaceId`
2. **`requireAuth`** — 401 if neither user session nor guest token
3. **`requireUser`** — 401 if no registered user (guest-only routes excluded)
4. **`requireWorkspaceAccess`** — 403 if user isn't a workspace member AND guest token doesn't match

---

## API Endpoints (27 total)

### Auth (`/api`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/register` | None | Create account — body: `{ email, password }` |
| POST | `/api/login` | None | Login — body: `{ email, password }` |
| POST | `/api/logout` | Session | Destroy session |
| GET | `/api/user` | Session | Get current user |

### Guest Session (`/api/guest`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/guest/start` | None | Create workspace + guest token → `{ guestToken, workspaceId }` |
| PUT | `/api/guest/onboarding` | Guest | Save onboarding data to workspace |
| GET | `/api/guest/workspace` | Guest | Get workspace for guest token |

### Workspaces (`/api/workspaces`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/workspaces` | User | List user's workspaces |
| POST | `/api/workspaces` | User | Create workspace |
| GET | `/api/workspaces/:id` | WS Access | Get workspace |
| PUT | `/api/workspaces/:id` | WS Access | Update workspace |
| PATCH | `/api/workspaces/:id/settings` | WS Access | Update totalBudget |
| POST | `/api/workspaces/:id/invite` | WS Access | Generate/return invite code + URL |
| GET | `/api/workspaces/:id/members` | WS Access | List members with user data |
| GET | `/api/workspaces/:id/summary` | WS Access | Computed aggregate summary |

### Directory (`/api/directory`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/directory` | None | List all vendor items |
| GET | `/api/directory/:id` | None | Get single vendor item |
| POST | `/api/admin/seed-directory` | None | Idempotent seed (skip if data exists) |

### Saved Vendors (`/api/workspaces/:id/saved-vendors`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `…/saved-vendors` | WS Access | List saved vendors (with vendor item join) |
| POST | `…/saved-vendors` | WS Access | Save a vendor — body: `{ vendorItemId }` |
| DELETE | `…/saved-vendors/:vendorId` | WS Access | Remove saved vendor |
| PATCH | `…/saved-vendors/:vendorItemId/status` | WS Access | Update contactStatus |

### Budget (`/api/workspaces/:id/budget`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `…/budget` | WS Access | List budget items |
| POST | `…/budget` | WS Access | Create — body: `{ category, amount }` |
| PUT | `…/budget/:itemId` | WS Access | Update amount/category/notes |
| DELETE | `…/budget/:itemId` | WS Access | Delete budget item |

### Guest Invites — Wedding Guest List (`/api/workspaces/:id/guest-invites`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `…/guest-invites` | WS Access | List guests |
| POST | `…/guest-invites` | WS Access | Add guest — body: `{ guestName }` |
| PUT | `…/guest-invites/:inviteId` | WS Access | Update RSVP — body: `{ rsvpStatus }` |
| DELETE | `…/guest-invites/:inviteId` | WS Access | Remove guest |

### Notes (`/api/notes` + `/api/workspaces/:id/notes`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/workspaces/:id/notes` | WS Access | List notes (ordered by updated_at desc) |
| POST | `/api/notes` | Auth | Create — body: `{ title, content, workspaceId }` |
| PUT | `/api/notes/:id` | Auth | Update — body: `{ title?, content? }` |
| DELETE | `/api/notes/:id` | Auth | Delete note |

### Invite Acceptance (`/api/invite`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/invite/:code` | None | Validate invite code, return workspace preview |
| POST | `/api/invite/:code/accept` | User | Accept invite — adds user as workspace member |

### Utility

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check → `{ status: 'ok', timestamp }` |

---

## Summary Endpoint Detail

`GET /api/workspaces/:id/summary` computes:

| Field | Source |
|-------|--------|
| `nikahDisplay` | `workspace.nikahDate` |
| `nikahCountdownDays` | Days until nikah date (null if unparseable) |
| `finalizedVenues` | saved_vendors WHERE section='venue' AND contactStatus='booked' |
| `finalizedVendors` | saved_vendors WHERE section='vendor' AND contactStatus='booked' |
| `totalBudget` | `workspace.totalBudget` |
| `budgetSpent` | SUM(budget_items.amount) |
| `budgetItems` | COUNT(budget_items) |
| `savedCount` | COUNT(saved_vendors) |
| `guestCount` | `workspace.guestCount` |
| `guestInvites` | COUNT(guest_invites) |
| `guestAttending` | COUNT WHERE rsvpStatus='attending' |
| `guestPending` | COUNT WHERE rsvpStatus='pending' |

---

## Seed Data

`POST /api/admin/seed-directory` inserts sample data (idempotent — skips if any vendor_items exist):

- **10 venues**: Banquet halls, mosques, hotels, community centers, gardens across US cities
- **12 vendors**: Photographers, caterers, florists, DJs, videographers, makeup artists, decorators, bakeries, officiants, invitation designers

---

## Frontend Bug Fixes (done alongside backend)

### 1. `TypeError: Failed to fetch` on "Start Planning"
- **Root cause**: Cross-origin `fetch` from `localhost:8081` → `localhost:3000` failed silently
- **Fix in `src/app/index.tsx`**: Added `startError` state; catch block now shows user-facing error message distinguishing network errors from server errors
- **Fix in `src/lib/useWorkspace.tsx`**: Added `body: JSON.stringify({})` to the `POST /api/guest/start` call
- **Backend fix**: CORS configured with `credentials: true`

### 2. Pre-commit Type/Lint Enforcement
- Installed **Husky** + **lint-staged** + **ESLint** + **eslint-config-expo**
- `.husky/pre-commit` runs `tsc --noEmit` then `lint-staged` (eslint --fix on staged .ts/.tsx)
- Commits are blocked if there are type errors or lint violations
- Config in `eslint.config.js` — fully documented with instructions for changing rules

### 3. Pre-existing Type Errors Fixed
- `src/app/(tabs)/hub.tsx` — invalid route `/notes/index` → `/notes`
- `src/components/ui/button.tsx` — `forwardRef<TouchableOpacity>` → `forwardRef<View>`
- `src/components/ui/checkbox.tsx` — same forwardRef fix

---

## Deployment

Target: **Railway / Render / Fly.io**

Required environment variables in production:
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SESSION_SECRET=<random-64-char-string>
PORT=3000
CORS_ORIGIN=https://your-app-domain.com
NODE_ENV=production
```

Build command: `cd server && npm run build`  
Start command: `cd server && npm start`
