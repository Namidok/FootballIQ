# FootballIQ Frontend

React + TypeScript + Vite, styled with Tailwind CSS.

## Setup

```bash
npm install
npm run dev
```

The dev server runs on http://localhost:5173 and proxies `/api/*` to the backend
at `http://localhost:8000` (see `vite.config.ts`) — make sure the backend is
running first (see `../backend/README.md`).

## Structure

- `src/api/client.ts` — typed fetch wrapper for the backend
- `src/context/FavoritesContext.tsx` — persists the user's chosen league/team to localStorage
- `src/pages/Onboarding.tsx` — league → team selection flow
- `src/pages/TeamDashboard.tsx` — standings, next-fixture prediction, news
- `src/components/WhatIfSimulator.tsx` — the interactive "what-if" inference simulator
- `src/components/ScorelineHeatmap.tsx` / `PredictionBar.tsx` — prediction visualizations
