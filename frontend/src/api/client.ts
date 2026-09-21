import type {
  League,
  Prediction,
  Team,
  TeamDashboard,
  WhatIfRequest,
} from '../types/api'

const BASE_URL = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${body}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  getLeagues: () => request<League[]>('/leagues'),
  getTeams: (leagueCode: string) => request<Team[]>(`/leagues/${leagueCode}/teams`),
  getTeamDashboard: (teamId: number) => request<TeamDashboard>(`/teams/${teamId}/dashboard`),
  getPrediction: (matchId: number) => request<Prediction>(`/predict/${matchId}`),
  postWhatIf: (payload: WhatIfRequest) =>
    request<Prediction>('/predict/whatif', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
