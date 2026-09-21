import soccerdata as sd

# soccerdata's Understat league codes for our five leagues (UCL isn't covered by Understat)
UNDERSTAT_LEAGUES = {
    "PL": "ENG-Premier League",
    "PD": "ESP-La Liga",
    "SA": "ITA-Serie A",
    "FL1": "FRA-Ligue 1",
}


class XGSource:
    """Pulls real Expected Goals (xG) data per match from Understat via soccerdata."""

    def get_match_xg(self, league_code: str, season: str):
        """season format soccerdata expects: e.g. '2425' for 2024-2025."""
        understat_league = UNDERSTAT_LEAGUES.get(league_code)
        if not understat_league:
            return None  # no Understat coverage (e.g. Champions League)

        understat = sd.Understat(leagues=understat_league, seasons=season)
        return understat.read_team_match_stats()
