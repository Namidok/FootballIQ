import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import Card from '../components/Card'
import NavBar from '../components/NavBar'
import PredictionBar from '../components/PredictionBar'
import ScorelineHeatmap from '../components/ScorelineHeatmap'
import TeamCrest from '../components/TeamCrest'
import WhatIfSimulator from '../components/WhatIfSimulator'
import { useFavorites } from '../context/FavoritesContext'
import { useTeamTheme } from '../hooks/useTeamTheme'
import type { TeamDashboard as TeamDashboardData } from '../types/api'

export default function TeamDashboard() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()
  const { clear } = useFavorites()

  const [data, setData] = useState<TeamDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!teamId) return
    setLoading(true)
    api
      .getTeamDashboard(Number(teamId))
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [teamId])

  useTeamTheme(data?.team)

  function handleChangeTeam() {
    clear()
    navigate('/')
  }

  if (loading) {
    return (
      <div>
        <NavBar />
        <CenteredMessage>Loading dashboard…</CenteredMessage>
      </div>
    )
  }
  if (error || !data) {
    return (
      <div>
        <NavBar />
        <CenteredMessage>
          {error ?? 'No data found.'}{' '}
          <Link to="/" className="underline" style={{ color: 'var(--accent)' }}>
            Back to onboarding
          </Link>
        </CenteredMessage>
      </div>
    )
  }

  const fixture = data.next_fixture
  const table = data.standings?.standings?.find((s) => s.type === 'TOTAL')?.table ?? []

  return (
    <div>
      <NavBar onChangeTeam={handleChangeTeam} />
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <TeamCrest crestUrl={data.team.crest_url} name={data.team.name} size={44} />
          <div>
            <h1 className="font-score text-2xl" style={{ color: 'var(--text-primary)' }}>
              {data.team.name}
            </h1>
            {data.league && (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {data.league.name}
              </p>
            )}
          </div>
        </motion.div>

        {!fixture ? (
          <Card title="Next Fixture">
            <p style={{ color: 'var(--text-muted)' }}>No scheduled fixture found.</p>
          </Card>
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="glass overflow-hidden rounded-2xl"
            style={{ boxShadow: '0 0 60px -20px rgba(232,162,61,0.25)' }}
          >
            {/* Scoreboard strip — kickoff clock flanked by crests, condensed numerals */}
            <div className="flex items-center justify-center gap-6 px-6 pt-6 sm:gap-12">
              <TeamMatchup crestUrl={fixture.home_team.crest_url} name={fixture.home_team.short_name ?? fixture.home_team.name} />
              <div className="text-center">
                <p className="flex items-center justify-center gap-1.5 text-xs uppercase" style={{ color: 'var(--text-muted)' }}>
                  <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full" style={{ color: 'var(--accent)', background: 'var(--accent)' }} />
                  Kickoff
                </p>
                <p className="font-score text-4xl leading-none" style={{ color: 'var(--accent)' }}>
                  {new Date(fixture.utc_date).toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(fixture.utc_date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <TeamMatchup crestUrl={fixture.away_team.crest_url} name={fixture.away_team.short_name ?? fixture.away_team.name} />
            </div>

            <div className="p-5 sm:p-6">
              {fixture.prediction ? (
                <>
                  <PredictionBar
                    prediction={fixture.prediction}
                    homeLabel={fixture.home_team.short_name ?? fixture.home_team.name}
                    awayLabel={fixture.away_team.short_name ?? fixture.away_team.name}
                  />
                  {fixture.prediction.scoreline_grid && (
                    <div className="mt-6 border-t pt-5" style={{ borderColor: 'var(--gridline)' }}>
                      <ScorelineHeatmap
                        grid={fixture.prediction.scoreline_grid}
                        homeLabel={fixture.home_team.short_name ?? fixture.home_team.name}
                        awayLabel={fixture.away_team.short_name ?? fixture.away_team.name}
                      />
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Prediction unavailable for this fixture.</p>
              )}
            </div>
          </motion.section>
        )}

        {fixture?.prediction && (
          <WhatIfSimulator
            matchId={fixture.id}
            basePrediction={fixture.prediction}
            homeLabel={fixture.home_team.short_name ?? fixture.home_team.name}
            awayLabel={fixture.away_team.short_name ?? fixture.away_team.name}
          />
        )}

        {/* Bento: standings + news side by side once there's room */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card title="Standings" className="h-full">
              {table.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Standings unavailable right now.</p>
              ) : (
                <table className="w-full text-left text-sm tabular-nums">
                  <thead>
                    <tr style={{ color: 'var(--text-muted)' }}>
                      <th className="pb-2 pr-2 font-normal">#</th>
                      <th className="pb-2 pr-2 font-normal">Team</th>
                      <th className="pb-2 pr-2 text-right font-normal">P</th>
                      <th className="pb-2 pr-2 text-right font-normal">GD</th>
                      <th className="pb-2 text-right font-normal">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((row) => {
                      const isOwnTeam = row.team.id.toString() === data.team.source_id
                      return (
                        <tr
                          key={row.team.id}
                          style={{
                            color: isOwnTeam ? 'var(--text-primary)' : 'var(--text-secondary)',
                            background: isOwnTeam ? 'rgba(232,162,61,0.1)' : 'transparent',
                          }}
                        >
                          <td className="py-1.5 pr-2">{row.position}</td>
                          <td className="py-1.5 pr-2">
                            <div className="flex items-center gap-2">
                              {row.team.crest && <img src={row.team.crest} alt="" className="h-4 w-4 object-contain" />}
                              <span className={isOwnTeam ? 'font-semibold' : ''}>{row.team.shortName ?? row.team.name}</span>
                            </div>
                          </td>
                          <td className="py-1.5 pr-2 text-right">{row.playedGames}</td>
                          <td className="py-1.5 pr-2 text-right">{row.goalDifference}</td>
                          <td className="py-1.5 text-right font-semibold">{row.points}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card title="News" className="h-full">
              {data.news.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No recent news found.</p>
              ) : (
                <ul className="space-y-4">
                  {data.news.map((article) => (
                    <li key={article.url} className="border-b pb-4 last:border-0 last:pb-0" style={{ borderColor: 'var(--gridline)' }}>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium transition hover:opacity-80"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {article.title}
                      </a>
                      <p className="mt-1 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>{article.source.name}</span>
                        <span aria-hidden style={{ width: 3, height: 3, background: 'var(--text-muted)', borderRadius: '50%' }} />
                        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function TeamMatchup({ crestUrl, name }: { crestUrl: string | null; name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-2"
    >
      <TeamCrest crestUrl={crestUrl} name={name} size={48} />
      <span className="max-w-20 text-center text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
        {name}
      </span>
    </motion.div>
  )
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[70svh] items-center justify-center px-6 text-center" style={{ color: 'var(--text-muted)' }}>
      {children}
    </div>
  )
}
