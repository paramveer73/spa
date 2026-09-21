# KTLN Studio

The website for KTLN Studio (microblading, brows and lashes in Clovis, CA), with online booking: clients browse the menu, sign in, pick a time and secure it with a card on file and a retainer. The studio runs its schedule, bookings, team and service menu from the admin panel at `/admin`.

React 19 + TypeScript + MUI on Vite, Redux Toolkit, Firebase (Auth, Realtime Database, Hosting, Cloud Functions) and Stripe. Conventions for working in the code are in [CLAUDE.md](CLAUDE.md).

## Layout

| Path | What it is |
|---|---|
| `src/` | The site and admin panel: `App.tsx` → lazy `pages/` → `components/` |
| `src/data/` | Brand copy (`brand.json`), marketing content (`seed.json`), images |
| `functions/` | Cloud Functions (`widgets`): card on file, checkout, the confirmation email |
| `scripts/` | One-off data tools, e.g. `build-catalog-import.mjs` for the service menu |

## Running it

```bash
npm install
npm run dev
```

Booking needs the backend too. Fill in `.env.development` (Stripe publishable key, function URL) and `functions/.env` (see `functions/.env.example`), then start the Functions emulator:

```bash
npm --prefix functions install
npm --prefix functions run serve
```

The emulator talks to the real database unless the Database emulator runs alongside it.

## Checks and deploys

```bash
npm run lint
npx tsc --noEmit
npm run build
firebase deploy
```

`firebase deploy` lints and deploys the functions first (`firebase.json` → `predeploy`). The Stripe and Gmail secrets must exist in Secret Manager before the first deploy — see `functions/.env.example`.
