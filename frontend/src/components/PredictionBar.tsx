import type { Prediction } from '../types/api'

interface Props {
  prediction: Prediction
  homeLabel: string
  awayLabel: string
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`
}

export default function PredictionBar({ prediction, homeLabel, awayLabel }: Props) {
  const { p_home_win, p_draw, p_away_win, expected_home_goals, expected_away_goals } = prediction

  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full" style={{ background: 'var(--gridline)' }}>
        <div
          style={{ width: pct(p_home_win), background: 'var(--home)' }}
          title={`${homeLabel} win: ${pct(p_home_win)}`}
        />
        <div className="mx-px" style={{ width: pct(p_draw), background: 'var(--draw)' }} title={`Draw: ${pct(p_draw)}`} />
        <div style={{ width: pct(p_away_win), background: 'var(--away)' }} title={`${awayLabel} win: ${pct(p_away_win)}`} />
      </div>

      {/* Legend: color is never the only carrier of identity — swatch + label + value */}
      <div className="flex justify-between text-sm">
        <LegendItem color="var(--home)" label={homeLabel} value={pct(p_home_win)} />
        <LegendItem color="var(--draw)" label="Draw" value={pct(p_draw)} />
        <LegendItem color="var(--away)" label={awayLabel} value={pct(p_away_win)} />
      </div>

      <p className="text-center text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
        Expected score {expected_home_goals.toFixed(2)} – {expected_away_goals.toFixed(2)}
      </p>
    </div>
  )
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="tabular-nums font-semibold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  )
}
