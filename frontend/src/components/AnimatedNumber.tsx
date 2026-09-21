import { animate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

/** Counts up to `value` whenever it changes — used for probability/percentage readouts. */
export default function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    })
    prev.current = value
    return () => controls.stop()
  }, [value])

  return (
    <span className="tabular-nums">
      {Math.round(display)}
      {suffix}
    </span>
  )
}
