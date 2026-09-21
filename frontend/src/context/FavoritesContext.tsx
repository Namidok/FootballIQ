import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface Favorites {
  leagueCode: string | null
  teamId: number | null
  teamName: string | null
}

interface FavoritesContextValue extends Favorites {
  setLeague: (code: string) => void
  setTeam: (id: number, name: string) => void
  clear: () => void
}

const STORAGE_KEY = 'footballiq.favorites'

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

function loadInitial(): Favorites {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore corrupted/blocked storage, fall back to empty state
  }
  return { leagueCode: null, teamId: null, teamName: null }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Favorites>(loadInitial)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    } catch {
      // best-effort persistence only
    }
  }, [favorites])

  const value: FavoritesContextValue = {
    ...favorites,
    setLeague: (code) => setFavorites({ leagueCode: code, teamId: null, teamName: null }),
    setTeam: (id, name) => setFavorites((prev) => ({ ...prev, teamId: id, teamName: name })),
    clear: () => setFavorites({ leagueCode: null, teamId: null, teamName: null }),
  }

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}
