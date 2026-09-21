import { Link } from 'react-router-dom'

export default function NavBar({ onChangeTeam }: { onChangeTeam?: () => void }) {
  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 backdrop-blur"
      style={{ background: 'rgba(17,21,15,0.9)', borderBottom: '1px solid var(--border)' }}
    >
      <Link to="/" className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-9 items-center justify-center font-score text-base"
          style={{ background: 'var(--accent)', color: 'var(--accent-ink)', clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }}
        >
          iQ
        </span>
        <span className="font-score text-lg" style={{ color: 'var(--text-primary)' }}>
          FootballIQ
        </span>
      </Link>
      {onChangeTeam && (
        <button
          onClick={onChangeTeam}
          className="px-3 py-1.5 text-sm transition hover:text-[var(--text-primary)]"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          Change team
        </button>
      )}
    </header>
  )
}
