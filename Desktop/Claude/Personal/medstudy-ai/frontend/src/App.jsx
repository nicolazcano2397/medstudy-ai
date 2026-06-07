import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import HomePage from './pages/HomePage'
import SummariesPage from './pages/SummariesPage'
import DiagramsPage from './pages/DiagramsPage'
import DiseasesPage from './pages/DiseasesPage'
import QuizzesPage from './pages/QuizzesPage'
import FoldersPage from './pages/FoldersPage'
import LoginPage from './pages/LoginPage'

function RequireAuth({ children }) {
  const token = localStorage.getItem('medstudy_token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
        <Route index element={<HomePage />} />
        <Route path="/summaries" element={<SummariesPage />} />
        <Route path="/diagrams" element={<DiagramsPage />} />
        <Route path="/diseases" element={<DiseasesPage />} />
        <Route path="/quizzes" element={<QuizzesPage />} />
        <Route path="/folders" element={<FoldersPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  )
}
