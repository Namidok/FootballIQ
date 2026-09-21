"""Real-time inference, including the What-If simulator.

The simulator does not synthesize data — it takes the real feature vector for a
fixture and applies bounded deltas the user chooses (e.g. "star player out" reduces
xG_avg by that player's real per-90 contribution), then reruns the same trained
models. No retraining happens at request time; both models are cheap enough for
synchronous inference.
"""
import sys
from dataclasses import asdict, replace
from datetime import datetime
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

import joblib
import numpy as np
from scipy.stats import poisson
from sqlalchemy.orm import Session

from ml.features import MatchFeatures, build_features

MODEL_DIR = Path(__file__).resolve().parent / "models"

_outcome_model = None
_home_goal_model = None
_away_goal_model = None


def _load_models():
    global _outcome_model, _home_goal_model, _away_goal_model
    if _outcome_model is None:
        _outcome_model = joblib.load(MODEL_DIR / "outcome_classifier.joblib")
        _home_goal_model = joblib.load(MODEL_DIR / "home_goals_poisson.joblib")
        _away_goal_model = joblib.load(MODEL_DIR / "away_goals_poisson.joblib")
    return _outcome_model, _home_goal_model, _away_goal_model


def predict_from_features(feats: MatchFeatures) -> dict:
    clf, home_goal_model, away_goal_model = _load_models()
    vec = np.array([feats.as_vector()])

    probs = clf.predict_proba(vec)[0]
    expected_home_goals = float(home_goal_model.predict(vec)[0])
    expected_away_goals = float(away_goal_model.predict(vec)[0])

    return {
        "p_home_win": float(probs[0]),
        "p_draw": float(probs[1]),
        "p_away_win": float(probs[2]),
        "expected_home_goals": round(expected_home_goals, 2),
        "expected_away_goals": round(expected_away_goals, 2),
        "scoreline_grid": _scoreline_grid(expected_home_goals, expected_away_goals),
    }


def _scoreline_grid(home_lambda: float, away_lambda: float, max_goals: int = 6) -> list[list[float]]:
    """Independent-Poisson scoreline probability grid: grid[h][a] = P(home=h, away=a)."""
    home_probs = [poisson.pmf(h, home_lambda) for h in range(max_goals + 1)]
    away_probs = [poisson.pmf(a, away_lambda) for a in range(max_goals + 1)]
    return [[round(hp * ap, 4) for ap in away_probs] for hp in home_probs]


def predict_fixture(db: Session, home_team_id: int, away_team_id: int, as_of: datetime,
                     is_continental: bool = False) -> dict:
    feats = build_features(db, home_team_id, away_team_id, as_of, is_continental)
    return predict_from_features(feats)


class WhatIfOverrides:
    """Bounded, real-data-anchored deltas the frontend sliders map to."""

    def __init__(
        self,
        home_star_player_out: bool = False,
        away_star_player_out: bool = False,
        home_star_xg_contribution: float = 0.0,   # real per-90 xG contribution of the player removed
        away_star_xg_contribution: float = 0.0,
        home_morale_delta: float = 0.0,             # -1.0 to +1.0, scales form_ppg
        away_morale_delta: float = 0.0,
        home_red_card: bool = False,                # applies a fixed empirical xG penalty
        away_red_card: bool = False,
    ):
        self.home_star_player_out = home_star_player_out
        self.away_star_player_out = away_star_player_out
        self.home_star_xg_contribution = home_star_xg_contribution
        self.away_star_xg_contribution = away_star_xg_contribution
        self.home_morale_delta = home_morale_delta
        self.away_morale_delta = away_morale_delta
        self.home_red_card = home_red_card
        self.away_red_card = away_red_card


RED_CARD_XG_PENALTY = 0.45  # empirical: teams down a man concede ~0.4-0.5 more xG on average


def apply_whatif(feats: MatchFeatures, overrides: WhatIfOverrides) -> MatchFeatures:
    home_xg_avg = feats.home_xg_avg
    away_xg_avg = feats.away_xg_avg
    home_xga_avg = feats.home_xga_avg
    away_xga_avg = feats.away_xga_avg
    home_form_ppg = feats.home_form_ppg
    away_form_ppg = feats.away_form_ppg

    if overrides.home_star_player_out:
        home_xg_avg = max(home_xg_avg - overrides.home_star_xg_contribution, 0.0)
    if overrides.away_star_player_out:
        away_xg_avg = max(away_xg_avg - overrides.away_star_xg_contribution, 0.0)

    home_form_ppg = max(home_form_ppg * (1 + overrides.home_morale_delta), 0.0)
    away_form_ppg = max(away_form_ppg * (1 + overrides.away_morale_delta), 0.0)

    if overrides.home_red_card:
        home_xg_avg = max(home_xg_avg - RED_CARD_XG_PENALTY, 0.0)
        away_xga_avg = away_xga_avg + RED_CARD_XG_PENALTY
    if overrides.away_red_card:
        away_xg_avg = max(away_xg_avg - RED_CARD_XG_PENALTY, 0.0)
        home_xga_avg = home_xga_avg + RED_CARD_XG_PENALTY

    return replace(
        feats,
        home_xg_avg=home_xg_avg,
        away_xg_avg=away_xg_avg,
        home_xga_avg=home_xga_avg,
        away_xga_avg=away_xga_avg,
        home_form_ppg=home_form_ppg,
        away_form_ppg=away_form_ppg,
    )


def predict_whatif(db: Session, home_team_id: int, away_team_id: int, as_of: datetime,
                    overrides: WhatIfOverrides, is_continental: bool = False) -> dict:
    base_feats = build_features(db, home_team_id, away_team_id, as_of, is_continental)
    adjusted_feats = apply_whatif(base_feats, overrides)
    result = predict_from_features(adjusted_feats)
    result["base_features"] = asdict(base_feats)
    result["adjusted_features"] = asdict(adjusted_feats)
    return result
