from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.base import get_db
from db.models import League, Team, TeamLeagueMembership
from pipeline.ingest_teams_and_leagues import CURRENT_SEASON

router = APIRouter(prefix="/leagues", tags=["leagues"])


@router.get("")
def list_leagues(db: Session = Depends(get_db)):
    leagues = db.query(League).all()
    return [{"code": l.code, "name": l.name, "country": l.country, "emblem_url": l.emblem_url} for l in leagues]


@router.get("/{league_code}/teams")
def list_teams(league_code: str, season: str = CURRENT_SEASON, db: Session = Depends(get_db)):
    league = db.query(League).filter_by(code=league_code).first()
    if not league:
        return []
    teams = (
        db.query(Team)
        .join(TeamLeagueMembership, TeamLeagueMembership.team_id == Team.id)
        .filter(TeamLeagueMembership.league_id == league.id, TeamLeagueMembership.season == season)
        .order_by(Team.name)
        .all()
    )
    return [
        {
            "id": t.id,
            "name": t.name,
            "short_name": t.short_name,
            "tla": t.tla,
            "crest_url": t.crest_url,
            "primary_color": t.primary_color,
            "primary_color_ink": t.primary_color_ink,
            "secondary_color": t.secondary_color,
        }
        for t in teams
    ]
