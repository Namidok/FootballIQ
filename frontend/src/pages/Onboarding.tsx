import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import TeamCrest from '../components/TeamCrest'
import { useFavorites } from '../context/FavoritesContext'
import type { League, Team } from '../types/api'

export default function Onboarding() {
  const navigate = useNavigate()
  const { leagueCode, setLeague, setTeam } = useFavorites()

  const [leagues, setLeagues] = useState<League[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingLeagues, setLoadingLeagues] = useState(true)
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .getLeagues()
      .then(setLeagues)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingLeagues(false))
  }, [])

  useEffect(() => {
    if (!leagueCode) {
      setTeams([])
      return
    }
    setLoadingTeams(true)
    api
      .getTeams(leagueCode)
      .then(setTeams)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingTeams(false))
  }, [leagueCode])

  function handleSelectTeam(team: Team) {
    setTeam(team.id, team.name)
    navigate(`/team/${team.id}`)
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-10 px-6 py-16">
      <div className="text-center">
        <span
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white"
          style={{ background: 'var(--home)' }}
        >
          iQ
        </span>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          FootballIQ
        </h1>
        <p className="mx-auto mt-2 max-w-md" style={{ color: 'var(--text-muted)' }}>
          Real fixtures, real stats, ML-powered match predictions across Europe's top leagues.
        </p>
      </div>

      {error && (
        <p
          className="rounded-xl p-3 text-center text-sm"
          style={{ background: 'rgba(230,103,103,0.1)', color: 'var(--away)', border: '1px solid rgba(230,103,103,0.3)' }}
        >
          {error} — is the backend running at localhost:8000?
        </p>
      )}

      <div>
        <p className="mb-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          1. Choose your favorite league
        </p>
        {loadingLeagues ? (
          <SkeletonRow count={5} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {leagues.map((l) => {
              const selected = l.code === leagueCode
              return (
                <button
                  key={l.code}
                  onClick={() => setLeague(l.code)}
                  className="flex flex-col items-center gap-2 rounded-xl p-4 transition"
                  style={{
                    background: selected ? 'rgba(57,135,229,0.12)' : 'var(--surface-1)',
                    border: `1px solid ${selected ? 'var(--home)' : 'var(--border)'}`,
                  }}
                >
                  {l.emblem_url ? (
                    <img src={l.emblem_url} alt={l.name} className="h-10 w-10 object-contain" />
                  ) : (
                    <div className="h-10 w-10 rounded-full" style={{ background: 'var(--surface-2)' }} />
                  )}
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {l.name}
                  </span>
                  {l.country && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {l.country}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {leagueCode && (
        <div>
          <p className="mb-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            2. Choose your favorite team
          </p>
          {loadingTeams ? (
            <SkeletonRow count={9} />
          ) : teams.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No teams found for this league yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTeam(t)}
                  className="flex items-center gap-3 rounded-xl p-3 text-left transition"
                  style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--home)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <TeamCrest crestUrl={t.crest_url} name={t.name} size={28} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {t.short_name ?? t.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SkeletonRow({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl" style={{ background: 'var(--surface-1)' }} />
      ))}
    </div>
  )
}
