from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.base import get_db
from db.models import Match
from ml.infer import WhatIfOverrides, predict_fixture, predict_whatif

router = APIRouter(prefix="/predict", tags=["predictions"])


@router.get("/{match_id}")
def predict(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).filter_by(id=match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    is_continental = match.league.code == "CL" if match.league else False
    return predict_fixture(db, match.home_team_id, match.away_team_id, match.utc_date, is_continental)


class WhatIfRequest(BaseModel):
    match_id: int
    home_star_player_out: bool = False
    away_star_player_out: bool = False
    home_star_xg_contribution: float = 0.0
    away_star_xg_contribution: float = 0.0
    home_morale_delta: float = 0.0   # -1.0 .. 1.0
    away_morale_delta: float = 0.0
    home_red_card: bool = False
    away_red_card: bool = False


@router.post("/whatif")
def predict_whatif_endpoint(req: WhatIfRequest, db: Session = Depends(get_db)):
    match = db.query(Match).filter_by(id=req.match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    is_continental = match.league.code == "CL" if match.league else False
    overrides = WhatIfOverrides(
        home_star_player_out=req.home_star_player_out,
        away_star_player_out=req.away_star_player_out,
        home_star_xg_contribution=req.home_star_xg_contribution,
        away_star_xg_contribution=req.away_star_xg_contribution,
        home_morale_delta=req.home_morale_delta,
        away_morale_delta=req.away_morale_delta,
        home_red_card=req.home_red_card,
        away_red_card=req.away_red_card,
    )
    return predict_whatif(db, match.home_team_id, match.away_team_id, match.utc_date,
                           overrides, is_continental)
