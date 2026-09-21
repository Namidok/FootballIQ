import { Link } from 'react-router-dom'

export default function NavBar({ onChangeTeam }: { onChangeTeam?: () => void }) {
  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 backdrop-blur"
      style={{ background: 'rgba(13,13,13,0.85)', borderBottom: '1px solid var(--border)' }}
    >
      <Link to="/" className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ background: 'var(--home)' }}
        >
          iQ
        </span>
        <span className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          FootballIQ
        </span>
      </Link>
      {onChangeTeam && (
        <button
          onClick={onChangeTeam}
          className="rounded-full px-3 py-1.5 text-sm transition hover:text-white"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          Change team
        </button>
      )}
    </header>
  )
}
