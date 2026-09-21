"""Syncs the latest Elo snapshot for every tracked team from clubelo.com."""
import sys
from datetime import datetime
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

import requests

from db.base import SessionLocal, init_db
from db.models import EloRating, Team
from pipeline.clients.clubelo import ClubEloClient


def run():
    init_db()
    db = SessionLocal()
    client = ClubEloClient()

    try:
        try:
            snapshot = client.get_ratings_for_date()
        except requests.exceptions.RequestException as e:
            print(f"clubelo.com is unreachable right now ({e}). Skipping Elo sync — "
                  "features.py falls back to a neutral 1500 prior, so training/inference "
                  "still work. Re-run this script later once the service is back.")
            return
        snapshot_by_name = {row["Club"].strip().lower(): row for _, row in snapshot.iterrows()}

        teams = db.query(Team).all()
        matched, unmatched = 0, []

        for team in teams:
            lookup_name = (team.clubelo_name or team.name).strip().lower()
            row = snapshot_by_name.get(lookup_name)
            if row is None:
                unmatched.append(team.name)
                continue

            date = datetime.fromisoformat(row["From"])
            existing = db.query(EloRating).filter_by(team_id=team.id, date=date).first()
            if not existing:
                db.add(EloRating(team_id=team.id, date=date, elo=float(row["Elo"])))
            matched += 1

        db.commit()
        print(f"Elo synced for {matched} teams; {len(unmatched)} unmatched "
              f"(set Team.clubelo_name manually for these): {unmatched[:15]}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
