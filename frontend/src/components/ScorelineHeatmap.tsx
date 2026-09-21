interface Props {
  grid: number[][] // grid[homeGoals][awayGoals] = probability
  homeLabel: string
  awayLabel: string
}

const SEQ_STEPS = ['#184f95', '#1c5cab', '#256abf', '#2a78d6', '#3987e5', '#6da7ec', '#9ec5f4', '#cde2fb']

function colorFor(p: number, max: number) {
  if (max === 0) return SEQ_STEPS[SEQ_STEPS.length - 1]
  const t = 1 - Math.min(p / max, 1) // 0 = darkest (most likely), 1 = lightest
  const idx = Math.round(t * (SEQ_STEPS.length - 1))
  return SEQ_STEPS[idx]
}

export default function ScorelineHeatmap({ grid, homeLabel, awayLabel }: Props) {
  const max = Math.max(...grid.flat())
  const maxGoals = grid.length - 1

  let bestHome = 0
  let bestAway = 0
  let bestP = -1
  grid.forEach((row, h) =>
    row.forEach((p, a) => {
      if (p > bestP) {
        bestP = p
        bestHome = h
        bestAway = a
      }
    }),
  )

  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        Most likely scoreline: <span style={{ color: 'var(--text-primary)' }}>{bestHome}–{bestAway}</span>{' '}
        ({Math.round(bestP * 100)}%)
      </p>
      <div className="overflow-x-auto">
        <table className="border-separate" style={{ borderSpacing: 3 }}>
          <thead>
            <tr>
              <th className="w-8 text-xs" style={{ color: 'var(--text-muted)' }} />
              {Array.from({ length: maxGoals + 1 }, (_, a) => (
                <th key={a} className="w-8 pb-1 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, h) => (
              <tr key={h}>
                <th className="pr-1 text-right text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
                {row.map((p, a) => {
                  const isBest = h === bestHome && a === bestAway
                  return (
                    <td key={a} className="p-0">
                      <div
                        className="flex h-8 w-8 cursor-default items-center justify-center rounded text-[10px] tabular-nums transition-transform duration-150 ease-out hover:z-10 hover:scale-125"
                        style={{
                          background: colorFor(p, max),
                          color: p / max > 0.5 ? '#ffffff' : 'var(--text-primary)',
                          boxShadow: isBest ? '0 0 0 2px var(--accent)' : 'none',
                        }}
                        title={`${homeLabel} ${h}–${a} ${awayLabel}: ${(p * 100).toFixed(1)}%`}
                      >
                        {Math.round(p * 100)}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        Rows track {homeLabel} goals, columns track {awayLabel} goals — each cell is the
        probability of that exact final score.
      </p>
    </div>
  )
}
