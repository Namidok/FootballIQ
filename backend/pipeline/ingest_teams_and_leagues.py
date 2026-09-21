"""One-time / periodic sync of leagues + teams from football-data.org into the DB.

Teams are linked to leagues via TeamLeagueMembership rather than a single FK on
Team, because a club can belong to more than one tracked competition in the same
season (e.g. a Premier League side also playing in the Champions League) — an
earlier single-FK design silently dropped a team from its domestic league
whenever it was synced again as part of another competition.
"""
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from db.base import SessionLocal, init_db
from db.models import League, Team, TeamLeagueMembership
from pipeline.clients.football_data import FootballDataClient
from pipeline.config import LEAGUES

CURRENT_SEASON = "2026"  # the 2026-2027 season, per football-data.org's season convention


def run(season: str = CURRENT_SEASON):
    init_db()
    db = SessionLocal()
    client = FootballDataClient()

    try:
        for code, meta in LEAGUES.items():
            league = db.query(League).filter_by(code=code).first()
            if not league:
                league = League(code=code, name=meta["name"], country=meta["country"])
                db.add(league)
                db.flush()

            try:
                competition = client.get_competition(code)
                league.emblem_url = competition.get("emblem")
            except Exception:
                pass  # emblem is cosmetic; keep going without it

            print(f"Syncing teams for {meta['name']} ({code}), season {season}...")

            teams = client.get_teams(code, season=season)
            for t in teams:
                existing = db.query(Team).filter_by(source_id=str(t["id"])).first()
                if existing:
                    existing.name = t["name"]
                    existing.short_name = t.get("shortName")
                    existing.tla = t.get("tla")
                    existing.crest_url = t.get("crest")
                    team = existing
                else:
                    team = Team(
                        name=t["name"],
                        short_name=t.get("shortName"),
                        tla=t.get("tla"),
                        crest_url=t.get("crest"),
                        source_id=str(t["id"]),
                    )
                    db.add(team)
                    db.flush()

                membership = db.query(TeamLeagueMembership).filter_by(
                    team_id=team.id, league_id=league.id, season=season,
                ).first()
                if not membership:
                    db.add(TeamLeagueMembership(team_id=team.id, league_id=league.id, season=season))

            db.commit()
            print(f"  -> {len(teams)} teams synced")
    finally:
        db.close()


if __name__ == "__main__":
    run()
