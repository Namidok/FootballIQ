import { motion } from 'framer-motion'
import type { Prediction } from '../types/api'
import AnimatedNumber from './AnimatedNumber'

interface Props {
  prediction: Prediction
  homeLabel: string
  awayLabel: string
}

function pct(n: number) {
  return Math.round(n * 100)
}

export default function PredictionBar({ prediction, homeLabel, awayLabel }: Props) {
  const { p_home_win, p_draw, p_away_win, expected_home_goals, expected_away_goals } = prediction

  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full" style={{ background: 'var(--gridline)' }}>
        <motion.div
          animate={{ width: `${pct(p_home_win)}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: 'linear-gradient(90deg, var(--home), #5aa3f5)' }}
          title={`${homeLabel} win: ${pct(p_home_win)}%`}
        />
        <motion.div
          animate={{ width: `${pct(p_draw)}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-px"
          style={{ background: 'var(--draw)' }}
          title={`Draw: ${pct(p_draw)}%`}
        />
        <motion.div
          animate={{ width: `${pct(p_away_win)}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: 'linear-gradient(90deg, #f08a8a, var(--away))' }}
          title={`${awayLabel} win: ${pct(p_away_win)}%`}
        />
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

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="font-score text-base" style={{ color: 'var(--text-primary)' }}>
        <AnimatedNumber value={value} suffix="%" />
      </span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  )
}
