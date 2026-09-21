import { useState } from 'react'
import { api } from '../api/client'
import type { Prediction, WhatIfRequest } from '../types/api'
import Card from './Card'
import PredictionBar from './PredictionBar'

interface Props {
  matchId: number
  basePrediction: Prediction
  homeLabel: string
  awayLabel: string
}

export default function WhatIfSimulator({ matchId, basePrediction, homeLabel, awayLabel }: Props) {
  const [homeStarOut, setHomeStarOut] = useState(false)
  const [awayStarOut, setAwayStarOut] = useState(false)
  const [homeStarXg, setHomeStarXg] = useState(0.4) // real per-90 xG contribution of the removed player
  const [awayStarXg, setAwayStarXg] = useState(0.4)
  const [homeMorale, setHomeMorale] = useState(0) // -1 .. 1
  const [awayMorale, setAwayMorale] = useState(0)
  const [homeRedCard, setHomeRedCard] = useState(false)
  const [awayRedCard, setAwayRedCard] = useState(false)

  const [result, setResult] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDirty =
    homeStarOut || awayStarOut || homeMorale !== 0 || awayMorale !== 0 || homeRedCard || awayRedCard

  async function runSimulation() {
    setLoading(true)
    setError(null)
    const payload: WhatIfRequest = {
      match_id: matchId,
      home_star_player_out: homeStarOut,
      away_star_player_out: awayStarOut,
      home_star_xg_contribution: homeStarXg,
      away_star_xg_contribution: awayStarXg,
      home_morale_delta: homeMorale,
      away_morale_delta: awayMorale,
      home_red_card: homeRedCard,
      away_red_card: awayRedCard,
    }
    try {
      const prediction = await api.postWhatIf(payload)
      setResult(prediction)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setHomeStarOut(false)
    setAwayStarOut(false)
    setHomeMorale(0)
    setAwayMorale(0)
    setHomeRedCard(false)
    setAwayRedCard(false)
    setResult(null)
  }

  return (
    <Card accent title="What-If Simulator">
      <p className="mb-5 text-xs" style={{ color: 'var(--text-muted)' }}>
        Adjusts real inputs to the model (xG, form) — no synthetic data, just bounded deltas on
        this fixture's actual feature vector.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TeamControls
          label={homeLabel}
          accent="var(--home)"
          starOut={homeStarOut}
          setStarOut={setHomeStarOut}
          starXg={homeStarXg}
          setStarXg={setHomeStarXg}
          morale={homeMorale}
          setMorale={setHomeMorale}
          redCard={homeRedCard}
          setRedCard={setHomeRedCard}
        />
        <TeamControls
          label={awayLabel}
          accent="var(--away)"
          starOut={awayStarOut}
          setStarOut={setAwayStarOut}
          starXg={awayStarXg}
          setStarXg={setAwayStarXg}
          morale={awayMorale}
          setMorale={setAwayMorale}
          redCard={awayRedCard}
          setRedCard={setAwayRedCard}
        />
      </div>

      <div className="mt-5 flex gap-2">
        <button
          onClick={runSimulation}
          disabled={loading || !isDirty}
          className="px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-30"
          style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
        >
          {loading ? 'Recalculating…' : 'Recalculate probability'}
        </button>
        {result && (
          <button
            onClick={reset}
            className="px-4 py-2 text-sm transition"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            Reset
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm" style={{ color: 'var(--away)' }}>
          {error}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 border-t pt-5 sm:grid-cols-2" style={{ borderColor: 'var(--gridline)' }}>
        <div>
          <p className="mb-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Base prediction
          </p>
          <PredictionBar prediction={basePrediction} homeLabel={homeLabel} awayLabel={awayLabel} />
        </div>
        <div>
          <p className="mb-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {result ? 'Simulated prediction' : 'Adjust inputs above'}
          </p>
          {result ? (
            <PredictionBar prediction={result} homeLabel={homeLabel} awayLabel={awayLabel} />
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No overrides applied yet.
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

interface TeamControlsProps {
  label: string
  accent: string
  starOut: boolean
  setStarOut: (v: boolean) => void
  starXg: number
  setStarXg: (v: number) => void
  morale: number
  setMorale: (v: number) => void
  redCard: boolean
  setRedCard: (v: boolean) => void
}

function TeamControls({
  label,
  accent,
  starOut,
  setStarOut,
  starXg,
  setStarXg,
  morale,
  setMorale,
  redCard,
  setRedCard,
}: TeamControlsProps) {
  return (
    <div className="space-y-4 rounded-xl p-4" style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
      <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: accent }} />
        {label}
      </p>

      <Toggle label="Rest star player" checked={starOut} onChange={setStarOut} accent={accent} />
      {starOut && (
        <div>
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Player's xG contribution</span>
            <span className="tabular-nums">{starXg.toFixed(2)} xG/90</span>
          </div>
          <input
            type="range"
            min={0}
            max={1.2}
            step={0.05}
            value={starXg}
            onChange={(e) => setStarXg(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: accent }}
          />
        </div>
      )}

      <div>
        <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Morale</span>
          <span className="tabular-nums">
            {morale > 0 ? `+${Math.round(morale * 100)}%` : `${Math.round(morale * 100)}%`}
          </span>
        </div>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.1}
          value={morale}
          onChange={(e) => setMorale(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: accent }}
        />
      </div>

      <Toggle label="Simulate red card" checked={redCard} onChange={setRedCard} accent="var(--away)" />
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
  accent,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  accent: string
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
        style={{ accentColor: accent }}
      />
    </label>
  )
}
