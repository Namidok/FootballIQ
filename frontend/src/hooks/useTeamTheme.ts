import { useEffect } from 'react'
import type { TeamColors } from '../types/api'

const DEFAULT_ACCENT = '#e8a23d'
const DEFAULT_ACCENT_INK = '#191204'
const DEFAULT_SECONDARY = '#3987e5'

/**
 * Retints the whole app's --accent / --team-secondary root variables to the
 * viewed team's real crest-derived colors (see backend/pipeline/clients/crest_colors.py),
 * and restores the neutral floodlight-amber defaults on unmount/team change.
 * Root-level because the ambient background and nav bar live outside this page.
 */
export function useTeamTheme(colors: TeamColors | null | undefined) {
  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--accent', colors?.primary_color || DEFAULT_ACCENT)
    root.setProperty('--accent-ink', colors?.primary_color_ink || DEFAULT_ACCENT_INK)
    root.setProperty('--team-secondary', colors?.secondary_color || DEFAULT_SECONDARY)

    return () => {
      root.setProperty('--accent', DEFAULT_ACCENT)
      root.setProperty('--accent-ink', DEFAULT_ACCENT_INK)
      root.setProperty('--team-secondary', DEFAULT_SECONDARY)
    }
  }, [colors?.primary_color, colors?.primary_color_ink, colors?.secondary_color])
}
