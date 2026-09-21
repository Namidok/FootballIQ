# FootballIQ

A match-outcome prediction app for the Premier League, La Liga, Serie A, Ligue 1,
and the UEFA Champions League — built entirely on real, live, and historical
football data (no synthetic/dummy data anywhere in the pipeline).

- **Backend** (`backend/`) — FastAPI + SQLAlchemy + XGBoost/Poisson regression,
  fed by football-data.org (fixtures/standings), ClubElo (cross-league Elo),
  Understat via `soccerdata` (xG), and NewsAPI (team news). See `backend/README.md`
  for setup and the data pipeline.
- **Frontend** (`frontend/`) — React + TypeScript + Vite + Tailwind. League/team
  onboarding, a team dashboard with live standings and ML predictions, and an
  interactive "What-If" simulator that reruns inference on bounded, real-data-anchored
  overrides (rest a player, adjust morale, simulate a red card). See `frontend/README.md`.

## Quick start

```bash
# backend
cd backend
source venv/bin/activate   # or create one: python -m venv venv
pip install -r requirements.txt
cp .env.example .env       # fill in FOOTBALL_DATA_API_KEY and NEWSAPI_KEY
python pipeline/ingest_teams_and_leagues.py
python pipeline/ingest_matches.py
python pipeline/ingest_elo.py
python ml/train.py
uvicorn api.main:app --reload

# frontend, in a second terminal
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.
