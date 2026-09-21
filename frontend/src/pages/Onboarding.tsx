import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import TeamCrest from '../components/TeamCrest'
import { useFavorites } from '../context/FavoritesContext'
import { useTeamTheme } from '../hooks/useTeamTheme'
import type { League, Team } from '../types/api'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { leagueCode, setLeague, setTeam } = useFavorites()

  const [leagues, setLeagues] = useState<League[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingLeagues, setLoadingLeagues] = useState(true)
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoveredTeam, setHoveredTeam] = useState<Team | null>(null)

  useTeamTheme(hoveredTeam)

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
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center"
      >
        <span
          className="mx-auto mb-4 flex h-12 w-14 items-center justify-center font-score text-xl shadow-[0_0_40px_-8px_var(--accent)]"
          style={{ background: 'var(--accent)', color: 'var(--accent-ink)', clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }}
        >
          iQ
        </span>
        <h1 className="font-score text-4xl" style={{ color: 'var(--text-primary)' }}>
          FootballIQ
        </h1>
        <p className="mx-auto mt-2 max-w-md" style={{ color: 'var(--text-muted)' }}>
          Real fixtures, real stats, ML-powered match predictions across Europe's top leagues.
        </p>
      </motion.div>

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
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {leagues.map((l) => {
              const selected = l.code === leagueCode
              return (
                <motion.button
                  key={l.code}
                  variants={item}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLeague(l.code)}
                  className="glass flex flex-col items-center gap-2 rounded-2xl p-4"
                  style={{
                    background: selected ? 'rgba(232,162,61,0.14)' : 'var(--surface-1)',
                    borderColor: selected ? 'var(--accent)' : 'var(--glass-border)',
                    boxShadow: selected ? '0 0 24px -6px var(--accent)' : 'none',
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
                </motion.button>
              )
            })}
          </motion.div>
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
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-2 sm:grid-cols-3"
            >
              {teams.map((t) => (
                <motion.button
                  key={t.id}
                  variants={item}
                  whileHover={{ y: -2, borderColor: 'var(--accent)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectTeam(t)}
                  onMouseEnter={() => setHoveredTeam(t)}
                  onMouseLeave={() => setHoveredTeam(null)}
                  onFocus={() => setHoveredTeam(t)}
                  onBlur={() => setHoveredTeam(null)}
                  className="glass flex items-center gap-3 rounded-2xl p-3 text-left"
                >
                  <TeamCrest crestUrl={t.crest_url} name={t.name} size={28} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {t.short_name ?? t.name}
                  </span>
                </motion.button>
              ))}
            </motion.div>
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
        <div key={i} className="glass h-20 animate-pulse rounded-2xl" />
      ))}
    </div>
  )
}
