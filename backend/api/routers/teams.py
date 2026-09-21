from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from db.base import get_db
from db.models import League, Match, Team, TeamLeagueMembership
from ml.infer import predict_fixture
from pipeline.clients.football_data import FootballDataClient
from pipeline.clients.news import NewsClient
from pipeline.ingest_teams_and_leagues import CURRENT_SEASON

router = APIRouter(prefix="/teams", tags=["teams"])


def _team_brief(team: Team | None) -> dict | None:
    if not team:
        return None
    return {"id": team.id, "name": team.name, "short_name": team.short_name, "crest_url": team.crest_url}


def _domestic_league(db: Session, team_id: int, season: str = CURRENT_SEASON) -> League | None:
    """A team's primary (non-continental) league membership — used for standings, since a
    club may also hold a Champions League membership in the same season."""
    return (
        db.query(League)
        .join(TeamLeagueMembership, TeamLeagueMembership.league_id == League.id)
        .filter(
            TeamLeagueMembership.team_id == team_id,
            TeamLeagueMembership.season == season,
            League.code != "CL",
        )
        .first()
    )


@router.get("/{team_id}/dashboard")
def team_dashboard(team_id: int, db: Session = Depends(get_db)):
    team = db.query(Team).filter_by(id=team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    next_fixture = (
        db.query(Match)
        .filter(
            Match.status.in_(["SCHEDULED", "TIMED"]),
            or_(Match.home_team_id == team_id, Match.away_team_id == team_id),
        )
        .order_by(Match.utc_date.asc())
        .first()
    )

    prediction = None
    home_team = away_team = None
    if next_fixture:
        is_continental = next_fixture.league.code == "CL" if next_fixture.league else False
        prediction = predict_fixture(
            db, next_fixture.home_team_id, next_fixture.away_team_id,
            next_fixture.utc_date, is_continental,
        )
        home_team = db.query(Team).filter_by(id=next_fixture.home_team_id).first()
        away_team = db.query(Team).filter_by(id=next_fixture.away_team_id).first()

    domestic_league = _domestic_league(db, team_id)

    standings = None
    try:
        if domestic_league:
            client = FootballDataClient()
            standings = client.get_standings(domestic_league.code)
    except Exception:
        standings = None  # live standings are best-effort; DB data still renders

    news = []
    try:
        news_client = NewsClient()
        news = news_client.get_team_news(team.name, page_size=8)
    except Exception:
        news = []  # NEWSAPI_KEY may not be configured locally

    return {
        "team": {"id": team.id, "name": team.name, "crest_url": team.crest_url, "source_id": team.source_id},
        "league": None if not domestic_league else {"code": domestic_league.code, "name": domestic_league.name},
        "next_fixture": None if not next_fixture else {
            "id": next_fixture.id,
            "utc_date": next_fixture.utc_date.isoformat(),
            "home_team": _team_brief(home_team),
            "away_team": _team_brief(away_team),
            "prediction": prediction,
        },
        "standings": standings,
        "news": news,
    }
