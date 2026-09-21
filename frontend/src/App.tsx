import { AnimatePresence, motion } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AmbientBackground from './components/AmbientBackground'
import { useFavorites } from './context/FavoritesContext'
import Onboarding from './pages/Onboarding'
import TeamDashboard from './pages/TeamDashboard'

export default function App() {
  const { teamId } = useFavorites()
  const location = useLocation()

  return (
    <>
      <AmbientBackground />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <Routes location={location}>
            <Route path="/" element={teamId ? <Navigate to={`/team/${teamId}`} replace /> : <Onboarding />} />
            <Route path="/team/:teamId" element={<TeamDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
