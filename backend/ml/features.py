"""Builds the real-data feature vector for a fixture: Elo, rolling form, xG, H2H, rest days."""
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy.orm import Session

from db.models import EloRating, Match


@dataclass
class MatchFeatures:
    home_elo: float
    away_elo: float
    elo_diff: float
    home_form_ppg: float          # points per game, last 5
    away_form_ppg: float
    home_xg_avg: float             # rolling xG for, last 5
    away_xg_avg: float
    home_xga_avg: float            # rolling xG against, last 5
    away_xga_avg: float
    h2h_home_win_rate: float
    home_rest_days: float
    away_rest_days: float
    is_neutral_or_continental: bool  # True for UCL — flags cross-league dynamics

    def as_vector(self) -> list[float]:
        return [
            self.home_elo, self.away_elo, self.elo_diff,
            self.home_form_ppg, self.away_form_ppg,
            self.home_xg_avg, self.away_xg_avg,
            self.home_xga_avg, self.away_xga_avg,
            self.h2h_home_win_rate,
            self.home_rest_days, self.away_rest_days,
            float(self.is_neutral_or_continental),
        ]

    @staticmethod
    def feature_names() -> list[str]:
        return [
            "home_elo", "away_elo", "elo_diff",
            "home_form_ppg", "away_form_ppg",
            "home_xg_avg", "away_xg_avg",
            "home_xga_avg", "away_xga_avg",
            "h2h_home_win_rate",
            "home_rest_days", "away_rest_days",
            "is_neutral_or_continental",
        ]


def _latest_elo(db: Session, team_id: int, before: datetime) -> float:
    row = (
        db.query(EloRating)
        .filter(EloRating.team_id == team_id, EloRating.date <= before)
        .order_by(EloRating.date.desc())
        .first()
    )
    return row.elo if row else 1500.0  # neutral prior for teams with no history yet


def _recent_finished_matches(db: Session, team_id: int, before: datetime, n: int = 5):
    return (
        db.query(Match)
        .filter(
            Match.status == "FINISHED",
            Match.utc_date < before,
            (Match.home_team_id == team_id) | (Match.away_team_id == team_id),
        )
        .order_by(Match.utc_date.desc())
        .limit(n)
        .all()
    )


def _form_ppg(matches: list[Match], team_id: int) -> float:
    if not matches:
        return 1.0  # league-average prior (~1 pt/game)
    points = 0
    for m in matches:
        is_home = m.home_team_id == team_id
        gf = m.home_goals if is_home else m.away_goals
        ga = m.away_goals if is_home else m.home_goals
        if gf is None or ga is None:
            continue
        if gf > ga:
            points += 3
        elif gf == ga:
            points += 1
    return points / len(matches)


def _xg_avgs(matches: list[Match], team_id: int) -> tuple[float, float]:
    xg_for, xg_against, count = 0.0, 0.0, 0
    for m in matches:
        is_home = m.home_team_id == team_id
        xf = m.home_xg if is_home else m.away_xg
        xa = m.away_xg if is_home else m.home_xg
        if xf is None or xa is None:
            continue
        xg_for += xf
        xg_against += xa
        count += 1
    if count == 0:
        return 1.3, 1.3  # league-average xG prior
    return xg_for / count, xg_against / count


def _h2h_home_win_rate(db: Session, home_id: int, away_id: int, before: datetime, n: int = 10) -> float:
    meetings = (
        db.query(Match)
        .filter(
            Match.status == "FINISHED",
            Match.utc_date < before,
            ((Match.home_team_id == home_id) & (Match.away_team_id == away_id))
            | ((Match.home_team_id == away_id) & (Match.away_team_id == home_id)),
        )
        .order_by(Match.utc_date.desc())
        .limit(n)
        .all()
    )
    if not meetings:
        return 0.45  # roughly league-average home win rate
    home_wins = 0
    for m in meetings:
        winner_is_listed_home_team = (
            m.home_goals is not None and m.away_goals is not None and m.home_goals > m.away_goals
        )
        this_team_was_home = m.home_team_id == home_id
        if winner_is_listed_home_team == this_team_was_home:
            home_wins += 1
    return home_wins / len(meetings)


def _rest_days(matches: list[Match], as_of: datetime) -> float:
    if not matches:
        return 7.0
    return max((as_of - matches[0].utc_date).days, 0)


def build_features(db: Session, home_team_id: int, away_team_id: int, as_of: datetime,
                    is_continental: bool = False) -> MatchFeatures:
    home_elo = _latest_elo(db, home_team_id, as_of)
    away_elo = _latest_elo(db, away_team_id, as_of)

    home_recent = _recent_finished_matches(db, home_team_id, as_of)
    away_recent = _recent_finished_matches(db, away_team_id, as_of)

    home_xg_avg, home_xga_avg = _xg_avgs(home_recent, home_team_id)
    away_xg_avg, away_xga_avg = _xg_avgs(away_recent, away_team_id)

    return MatchFeatures(
        home_elo=home_elo,
        away_elo=away_elo,
        elo_diff=home_elo - away_elo,
        home_form_ppg=_form_ppg(home_recent, home_team_id),
        away_form_ppg=_form_ppg(away_recent, away_team_id),
        home_xg_avg=home_xg_avg,
        away_xg_avg=away_xg_avg,
        home_xga_avg=home_xga_avg,
        away_xga_avg=away_xga_avg,
        h2h_home_win_rate=_h2h_home_win_rate(db, home_team_id, away_team_id, as_of),
        home_rest_days=_rest_days(home_recent, as_of),
        away_rest_days=_rest_days(away_recent, as_of),
        is_neutral_or_continental=is_continental,
    )
