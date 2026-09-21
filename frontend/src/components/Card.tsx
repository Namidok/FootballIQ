import type { ReactNode } from 'react'

export default function Card({
  children,
  className = '',
  title,
  eyebrow,
}: {
  children: ReactNode
  className?: string
  title?: string
  eyebrow?: string
}) {
  return (
    <section
      className={`rounded-2xl p-5 sm:p-6 ${className}`}
      style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
    >
      {eyebrow && (
        <p className="mb-1 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {eyebrow}
        </p>
      )}
      {title && (
        <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}
