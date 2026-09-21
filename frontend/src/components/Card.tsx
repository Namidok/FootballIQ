import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export default function Card({
  children,
  className = '',
  title,
  accent = false,
}: {
  children: ReactNode
  className?: string
  title?: string
  /** Marks this as the page's primary panel — gets the amber rule instead of a neutral one. */
  accent?: boolean
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`glass rounded-2xl p-5 sm:p-6 ${className}`}
      style={{ borderLeft: `3px solid ${accent ? 'var(--accent)' : 'var(--glass-border)'}` }}
    >
      {title && (
        <h2 className="font-score mb-4 text-xl" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
      )}
      {children}
    </motion.section>
  )
}
