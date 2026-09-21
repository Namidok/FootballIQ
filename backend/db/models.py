from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint, Boolean
)
from sqlalchemy.orm import relationship

from db.base import Base


class League(Base):
    __tablename__ = "leagues"

    id = Column(Integer, primary_key=True)
    code = Column(String, unique=True, nullable=False)      # e.g. "PL", "PD", "SA", "FL1", "CL"
    name = Column(String, nullable=False)                    # e.g. "Premier League"
    country = Column(String, nullable=True)
    source_id = Column(String, nullable=True)                 # id used by football-data.org
    emblem_url = Column(String, nullable=True)

    memberships = relationship("TeamLeagueMembership", back_populates="league")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, index=True)
    short_name = Column(String, nullable=True)
    tla = Column(String, nullable=True)
    crest_url = Column(String, nullable=True)
    # derived from the actual crest image (see pipeline/clients/crest_colors.py) — real,
    # not hand-typed brand guesses — used to theme a team's dashboard
    primary_color = Column(String, nullable=True)
    primary_color_ink = Column(String, nullable=True)
    secondary_color = Column(String, nullable=True)
    source_id = Column(String, nullable=True, index=True)      # football-data.org team id
    clubelo_name = Column(String, nullable=True)               # name as used on clubelo.com
    fbref_id = Column(String, nullable=True)

    memberships = relationship("TeamLeagueMembership", back_populates="team")

    __table_args__ = (UniqueConstraint("source_id", name="uq_team_source_id"),)


class TeamLeagueMembership(Base):
    """A team can belong to several competitions in the same season (e.g. a domestic
    league plus the Champions League) — this many-to-many table is the fix for a bug
    where a single Team.league_id FK silently overwrote a team's domestic league
    whenever it was also synced as a Champions League participant."""
    __tablename__ = "team_league_memberships"

    id = Column(Integer, primary_key=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    league_id = Column(Integer, ForeignKey("leagues.id"), nullable=False, index=True)
    season = Column(String, nullable=False)   # e.g. "2026" for the 2026-2027 season

    team = relationship("Team", back_populates="memberships")
    league = relationship("League", back_populates="memberships")

    __table_args__ = (
        UniqueConstraint("team_id", "league_id", "season", name="uq_team_league_season"),
    )


class EloRating(Base):
    """Daily Elo snapshot per team, sourced from clubelo.com — globally comparable across leagues."""
    __tablename__ = "elo_ratings"

    id = Column(Integer, primary_key=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    elo = Column(Float, nullable=False)

    __table_args__ = (UniqueConstraint("team_id", "date", name="uq_elo_team_date"),)


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True)
    source_id = Column(String, nullable=True, unique=True)
    league_id = Column(Integer, ForeignKey("leagues.id"), nullable=False)
    season = Column(String, nullable=False)                    # e.g. "2025-2026"
    matchday = Column(Integer, nullable=True)
    utc_date = Column(DateTime, nullable=False, index=True)
    status = Column(String, nullable=False, default="SCHEDULED")  # SCHEDULED / FINISHED / LIVE ...

    home_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    away_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)

    home_goals = Column(Integer, nullable=True)
    away_goals = Column(Integer, nullable=True)

    # advanced stats, filled in post-match by the xG pipeline (Understat/FBref via soccerdata)
    home_xg = Column(Float, nullable=True)
    away_xg = Column(Float, nullable=True)

    home_team = relationship("Team", foreign_keys=[home_team_id])
    away_team = relationship("Team", foreign_keys=[away_team_id])
    league = relationship("League")


class Injury(Base):
    """Lightweight injury/availability flag, derived from news scans — not synthetic, just sparse."""
    __tablename__ = "injuries"

    id = Column(Integer, primary_key=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    player_name = Column(String, nullable=False)
    status = Column(String, nullable=False)   # "injured", "suspended", "doubtful"
    source_headline = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    reported_at = Column(DateTime, default=datetime.utcnow)


class Prediction(Base):
    """Cached model output for a fixture, so the dashboard doesn't re-run inference on every load."""
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False, unique=True)
    model_version = Column(String, nullable=False)

    p_home_win = Column(Float, nullable=False)
    p_draw = Column(Float, nullable=False)
    p_away_win = Column(Float, nullable=False)

    expected_home_goals = Column(Float, nullable=True)
    expected_away_goals = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
