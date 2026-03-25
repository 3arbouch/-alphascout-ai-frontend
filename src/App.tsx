import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Strategies from './pages/Strategies'
import Backtests from './pages/Backtests'
import Deployments from './pages/Deployments'
import Chat from './pages/Chat'

export default function App() {
  const { user, loading, signIn, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={signIn} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout email={user.email || ''} onSignOut={signOut} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/strategies" element={<Strategies />} />
          <Route path="/backtests" element={<Backtests />} />
          <Route path="/deployments" element={<Deployments />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
