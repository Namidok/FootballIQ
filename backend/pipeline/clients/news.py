import requests

from pipeline.config import NEWSAPI_KEY, NEWSAPI_BASE_URL


class NewsClient:
    """Wraps NewsAPI.org for team-scoped news, injuries, and transfer gossip."""

    def __init__(self, api_key: str = NEWSAPI_KEY):
        if not api_key:
            raise RuntimeError("NEWSAPI_KEY is not set (see backend/.env.example)")
        self.api_key = api_key

    def get_team_news(self, team_name: str, page_size: int = 10) -> list[dict]:
        params = {
            "q": f'"{team_name}"',
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": page_size,
            "apiKey": self.api_key,
        }
        resp = requests.get(f"{NEWSAPI_BASE_URL}/everything", params=params, timeout=15)
        resp.raise_for_status()
        return resp.json().get("articles", [])

    def get_injury_news(self, team_name: str, page_size: int = 10) -> list[dict]:
        params = {
            "q": f'"{team_name}" AND (injury OR injured OR suspended OR "out for")',
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": page_size,
            "apiKey": self.api_key,
        }
        resp = requests.get(f"{NEWSAPI_BASE_URL}/everything", params=params, timeout=15)
        resp.raise_for_status()
        return resp.json().get("articles", [])
