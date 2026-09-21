/**
 * Fixed ambient backdrop: drifting blurred color orbs behind a subtle pitch-line
 * texture. Pure CSS animation (transform/opacity only) so it's cheap and respects
 * prefers-reduced-motion via the stylesheet below.
 */
export default function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: 'var(--surface-0)' }}>
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />
      <div className="pitch-lines" />
      <div className="vignette" />

      <style>{`
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.35;
        }
        .orb-a {
          width: 42vw;
          height: 42vw;
          top: -10%;
          left: -8%;
          background: radial-gradient(circle at 30% 30%, var(--accent), transparent 70%);
          animation: drift-a 26s ease-in-out infinite;
        }
        .orb-b {
          width: 38vw;
          height: 38vw;
          bottom: -12%;
          right: -6%;
          background: radial-gradient(circle at 60% 40%, var(--team-secondary), transparent 70%);
          opacity: 0.22;
          animation: drift-b 32s ease-in-out infinite;
        }
        .orb-c {
          width: 30vw;
          height: 30vw;
          top: 35%;
          right: 20%;
          background: radial-gradient(circle at 50% 50%, var(--away), transparent 70%);
          opacity: 0.14;
          animation: drift-c 38s ease-in-out infinite;
        }
        @keyframes drift-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(6vw, 8vh) scale(1.1); }
        }
        @keyframes drift-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-5vw, -6vh) scale(1.08); }
        }
        @keyframes drift-c {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-4vw, 5vh) scale(0.95); }
        }
        .pitch-lines {
          position: absolute;
          inset: 0;
          opacity: 0.05;
          background-image:
            repeating-linear-gradient(0deg, var(--text-primary) 0, var(--text-primary) 1px, transparent 1px, transparent 96px),
            repeating-linear-gradient(90deg, var(--text-primary) 0, var(--text-primary) 1px, transparent 1px, transparent 96px);
        }
        .vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 40%, var(--surface-0) 100%);
        }
        @media (prefers-reduced-motion: reduce) {
          .orb-a, .orb-b, .orb-c { animation: none; }
        }
      `}</style>
    </div>
  )
}
