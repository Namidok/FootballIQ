import os

from dotenv import load_dotenv

load_dotenv()

FOOTBALL_DATA_API_KEY = os.getenv("FOOTBALL_DATA_API_KEY", "")
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY", "")

FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4"
NEWSAPI_BASE_URL = "https://newsapi.org/v2"

# football-data.org competition codes for the five target competitions
LEAGUES = {
    "PL": {"name": "Premier League", "country": "England"},
    "PD": {"name": "La Liga", "country": "Spain"},
    "SA": {"name": "Serie A", "country": "Italy"},
    "FL1": {"name": "Ligue 1", "country": "France"},
    "CL": {"name": "UEFA Champions League", "country": "Europe"},
}

# football-data.org allows 10 req/min on the free tier — stay under it
FOOTBALL_DATA_RATE_LIMIT_PER_MIN = 10
