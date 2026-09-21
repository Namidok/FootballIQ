# FootballIQ Backend

## Setup

```bash
cd backend
source venv/bin/activate
cp .env.example .env   # then fill in FOOTBALL_DATA_API_KEY and NEWSAPI_KEY
```

Get free API keys:
- `FOOTBALL_DATA_API_KEY` — https://www.football-data.org/client/register
- `NEWSAPI_KEY` — https://newsapi.org/register

ClubElo and Understat (via `soccerdata`) need no key.

## Data pipeline (run in order)

```bash
python pipeline/ingest_teams_and_leagues.py   # leagues + teams
python pipeline/ingest_matches.py             # fixtures + results
python pipeline/ingest_elo.py                 # Elo ratings (cross-league comparable)
```

Note: `ingest_elo.py` matches teams by name between football-data.org and
clubelo.com. Where names differ (e.g. "Manchester City" vs "Man City"), it
reports the team as unmatched — set `Team.clubelo_name` manually for those
rows before re-running.

xG backfill (Understat, via `soccerdata`) is available in
`pipeline/clients/xg_source.py::XGSource.get_match_xg` — wire it into a
`ingest_xg.py` script once you've picked season codes to backfill; it isn't
run automatically since Understat coverage doesn't include the Champions League.

## Train models

Needs at least ~50 finished matches with features in the DB (more for
anything meaningful — a full season backfill is recommended).

```bash
python ml/train.py
```

Produces `ml/models/{outcome_classifier,home_goals_poisson,away_goals_poisson}.joblib`.

## Run the API

```bash
uvicorn api.main:app --reload
```

Docs at http://localhost:8000/docs.

## Key endpoints

- `GET /leagues` — the 5 tracked competitions
- `GET /leagues/{code}/teams` — teams in a league (onboarding dropdown)
- `GET /teams/{id}/dashboard` — standings + next-fixture prediction + news
- `GET /predict/{match_id}` — model prediction for a fixture
- `POST /predict/whatif` — What-If simulator (star player out, morale, red card)
