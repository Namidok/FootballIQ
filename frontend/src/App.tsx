import { Navigate, Route, Routes } from 'react-router-dom'
import { useFavorites } from './context/FavoritesContext'
import Onboarding from './pages/Onboarding'
import TeamDashboard from './pages/TeamDashboard'

export default function App() {
  const { teamId } = useFavorites()

  return (
    <Routes>
      <Route path="/" element={teamId ? <Navigate to={`/team/${teamId}`} replace /> : <Onboarding />} />
      <Route path="/team/:teamId" element={<TeamDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
