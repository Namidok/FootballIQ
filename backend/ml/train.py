"""Trains two models from real historical matches in the DB:

1. XGBoost multiclass classifier -> P(home win), P(draw), P(away win)
2. Poisson regressions (home goals, away goals) -> expected scoreline, from which
   a full scoreline probability grid can be derived (independent Poisson approx).

Run after ingest_matches.py / ingest_elo.py have populated real historical data.
"""
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

import joblib
import numpy as np
import xgboost as xgb
from sklearn.linear_model import PoissonRegressor
from sklearn.model_selection import train_test_split

from db.base import SessionLocal
from db.models import Match
from ml.features import MatchFeatures, build_features

MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_DIR.mkdir(exist_ok=True)


def _label(home_goals: int, away_goals: int) -> int:
    if home_goals > away_goals:
        return 0  # home win
    if home_goals == away_goals:
        return 1  # draw
    return 2      # away win


def build_training_set():
    db = SessionLocal()
    try:
        finished = (
            db.query(Match)
            .filter(Match.status == "FINISHED", Match.home_goals.isnot(None))
            .order_by(Match.utc_date.asc())
            .all()
        )

        X, y_outcome, y_home_goals, y_away_goals = [], [], [], []
        for m in finished:
            is_continental = m.league_id is not None  # refined by caller if needed
            feats = build_features(db, m.home_team_id, m.away_team_id, m.utc_date,
                                    is_continental=False)
            X.append(feats.as_vector())
            y_outcome.append(_label(m.home_goals, m.away_goals))
            y_home_goals.append(m.home_goals)
            y_away_goals.append(m.away_goals)

        return np.array(X), np.array(y_outcome), np.array(y_home_goals), np.array(y_away_goals)
    finally:
        db.close()


def train():
    X, y_outcome, y_home_goals, y_away_goals = build_training_set()
    if len(X) < 50:
        raise RuntimeError(
            f"Only {len(X)} finished matches with features found — run the ingest_* pipeline "
            "scripts to populate real historical data before training."
        )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_outcome, test_size=0.2, random_state=42, stratify=y_outcome
    )

    clf = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        objective="multi:softprob",
        num_class=3,
        eval_metric="mlogloss",
    )
    clf.fit(X_train, y_train)
    test_acc = clf.score(X_test, y_test)
    print(f"XGBoost outcome classifier test accuracy: {test_acc:.3f}")

    home_goal_model = PoissonRegressor(alpha=1.0, max_iter=500)
    home_goal_model.fit(X, y_home_goals)

    away_goal_model = PoissonRegressor(alpha=1.0, max_iter=500)
    away_goal_model.fit(X, y_away_goals)

    joblib.dump(clf, MODEL_DIR / "outcome_classifier.joblib")
    joblib.dump(home_goal_model, MODEL_DIR / "home_goals_poisson.joblib")
    joblib.dump(away_goal_model, MODEL_DIR / "away_goals_poisson.joblib")
    print(f"Models saved to {MODEL_DIR}")


if __name__ == "__main__":
    train()
