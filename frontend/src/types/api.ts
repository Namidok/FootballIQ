export interface League {
  code: string
  name: string
  country: string | null
  emblem_url: string | null
}

export interface TeamColors {
  primary_color: string | null
  primary_color_ink: string | null
  secondary_color: string | null
}

export interface Team extends TeamColors {
  id: number
  name: string
  short_name: string | null
  tla: string | null
  crest_url?: string | null
}

export interface Prediction {
  p_home_win: number
  p_draw: number
  p_away_win: number
  expected_home_goals: number
  expected_away_goals: number
  scoreline_grid?: number[][]
  base_features?: Record<string, number | boolean>
  adjusted_features?: Record<string, number | boolean>
}

export interface TeamBrief {
  id: number
  name: string
  short_name: string | null
  crest_url: string | null
}

export interface NextFixture {
  id: number
  utc_date: string
  home_team: TeamBrief
  away_team: TeamBrief
  prediction: Prediction | null
}

export interface NewsArticle {
  title: string
  description: string | null
  url: string
  source: { name: string }
  publishedAt: string
}

export interface StandingsTableRow {
  position: number
  team: { id: number; name: string; crest?: string; shortName?: string }
  playedGames: number
  won: number
  draw: number
  lost: number
  points: number
  goalDifference: number
}

export interface Standings {
  standings: {
    type: string
    table: StandingsTableRow[]
  }[]
}

export interface TeamDashboard {
  team: { id: number; name: string; crest_url: string | null; source_id: string | null } & TeamColors
  league: { code: string; name: string } | null
  next_fixture: NextFixture | null
  standings: Standings | null
  news: NewsArticle[]
}

export interface WhatIfRequest {
  match_id: number
  home_star_player_out?: boolean
  away_star_player_out?: boolean
  home_star_xg_contribution?: number
  away_star_xg_contribution?: number
  home_morale_delta?: number
  away_morale_delta?: number
  home_red_card?: boolean
  away_red_card?: boolean
}
