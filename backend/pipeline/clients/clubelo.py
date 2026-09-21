from io import StringIO
from datetime import date

import pandas as pd
import requests

CLUBELO_BASE_URL = "http://api.clubelo.com"


class ClubEloClient:
    """Client for clubelo.com's free, keyless API.

    Elo ratings here are globally comparable across leagues, which is exactly what's
    needed to compare e.g. a Ligue 1 side to a Premier League side ahead of a
    Champions League tie, without inventing an ad-hoc cross-league coefficient.
    """

    def get_team_history(self, club_name: str) -> pd.DataFrame:
        """club_name must match clubelo's URL-safe naming (e.g. 'Man_City')."""
        resp = requests.get(f"{CLUBELO_BASE_URL}/{club_name}", timeout=15)
        resp.raise_for_status()
        df = pd.read_csv(StringIO(resp.text))
        df["Date"] = pd.to_datetime(df["From"])
        return df[["Club", "Elo", "Date"]]

    def get_ratings_for_date(self, day: date | None = None) -> pd.DataFrame:
        """Snapshot of every team's Elo as of a given date (defaults to today)."""
        day_str = (day or date.today()).isoformat()
        resp = requests.get(f"{CLUBELO_BASE_URL}/{day_str}", timeout=15)
        resp.raise_for_status()
        return pd.read_csv(StringIO(resp.text))
