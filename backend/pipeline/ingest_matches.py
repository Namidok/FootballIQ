"""Syncs fixtures/results for every tracked league from football-data.org."""
import sys
from datetime import datetime
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from db.base import SessionLocal, init_db
from db.models import League, Match, Team
from pipeline.clients.football_data import FootballDataClient
from pipeline.config import LEAGUES


def _get_or_create_team_stub(db, source_id: str, name: str) -> Team:
    """Handles teams that appear in match data but weren't in the /teams sync (e.g. UCL qualifiers)."""
    team = db.query(Team).filter_by(source_id=str(source_id)).first()
    if not team:
        team = Team(name=name, source_id=str(source_id))
        db.add(team)
        db.flush()
    return team


def run(seasons: list[str] | None = None):
    """seasons: e.g. ["2023", "2024"] to also backfill the 2023-24 and 2024-25 seasons
    in addition to the current one. football-data.org's free tier serves several
    prior seasons per competition."""
    init_db()
    db = SessionLocal()
    client = FootballDataClient()

    try:
        for code in LEAGUES:
            league = db.query(League).filter_by(code=code).first()
            if not league:
                print(f"League {code} not found — run ingest_teams_and_leagues.py first")
                continue

            all_matches = []
            print(f"Syncing matches for {code} (current season)...")
            all_matches += client.get_matches(code)

            for season in (seasons or []):
                print(f"Syncing matches for {code} (season {season})...")
                all_matches += client.get_matches(code, season=season)

            for m in all_matches:
                home = _get_or_create_team_stub(db, m["homeTeam"]["id"], m["homeTeam"]["name"])
                away = _get_or_create_team_stub(db, m["awayTeam"]["id"], m["awayTeam"]["name"])

                existing = db.query(Match).filter_by(source_id=str(m["id"])).first()
                score = m.get("score", {}).get("fullTime", {})

                fields = dict(
                    league_id=league.id,
                    season=m["season"]["startDate"][:4] + "-" + m["season"]["endDate"][:4],
                    matchday=m.get("matchday"),
                    utc_date=datetime.fromisoformat(m["utcDate"].replace("Z", "+00:00")),
                    status=m["status"],
                    home_team_id=home.id,
                    away_team_id=away.id,
                    home_goals=score.get("home"),
                    away_goals=score.get("away"),
                )

                if existing:
                    for k, v in fields.items():
                        setattr(existing, k, v)
                else:
                    db.add(Match(source_id=str(m["id"]), **fields))

            db.commit()
            print(f"  -> {len(all_matches)} matches synced")
    finally:
        db.close()


if __name__ == "__main__":
    run(seasons=["2023", "2024"])  # free tier only serves the last few seasons
