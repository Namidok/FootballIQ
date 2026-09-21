import time

import requests

from pipeline.config import FOOTBALL_DATA_API_KEY, FOOTBALL_DATA_BASE_URL, FOOTBALL_DATA_RATE_LIMIT_PER_MIN
from pipeline.rate_limiter import TokenBucketRateLimiter

_limiter = TokenBucketRateLimiter(FOOTBALL_DATA_RATE_LIMIT_PER_MIN)


class FootballDataClient:
    """Thin client for api.football-data.org — live fixtures, standings, competition metadata.

    Respects the API's own throttling signals: on a 429 it backs off using
    Retry-After (or a safe default) instead of relying solely on the local
    token-bucket estimate, then retries once.
    """

    def __init__(self, api_key: str = FOOTBALL_DATA_API_KEY):
        if not api_key:
            raise RuntimeError("FOOTBALL_DATA_API_KEY is not set (see backend/.env.example)")
        self.session = requests.Session()
        self.session.headers.update({"X-Auth-Token": api_key})

    def _get(self, path: str, params: dict | None = None, _retried: bool = False) -> dict:
        _limiter.wait()
        resp = self.session.get(f"{FOOTBALL_DATA_BASE_URL}{path}", params=params, timeout=15)

        if resp.status_code == 429 and not _retried:
            retry_after = float(resp.headers.get("Retry-After", 60))
            print(f"Rate limited by football-data.org, backing off {retry_after}s...")
            time.sleep(retry_after)
            return self._get(path, params, _retried=True)

        resp.raise_for_status()
        return resp.json()

    def get_competition(self, competition_code: str) -> dict:
        return self._get(f"/competitions/{competition_code}")

    def get_teams(self, competition_code: str, season: str | None = None) -> list[dict]:
        params = {"season": season} if season else None
        data = self._get(f"/competitions/{competition_code}/teams", params=params)
        return data.get("teams", [])

    def get_standings(self, competition_code: str) -> dict:
        return self._get(f"/competitions/{competition_code}/standings")

    def get_matches(self, competition_code: str, status: str | None = None, date_from: str | None = None,
                     date_to: str | None = None, season: str | None = None) -> list[dict]:
        params = {}
        if status:
            params["status"] = status
        if date_from:
            params["dateFrom"] = date_from
        if date_to:
            params["dateTo"] = date_to
        if season:
            params["season"] = season  # e.g. "2023" for the 2023-2024 season
        data = self._get(f"/competitions/{competition_code}/matches", params=params)
        return data.get("matches", [])

    def get_team_matches(self, team_id: int, limit: int = 10) -> list[dict]:
        data = self._get(f"/teams/{team_id}/matches", params={"limit": limit})
        return data.get("matches", [])
