import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import AuthRedirect from './components/AuthRedirect'
import DashboardPage from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import useAuthStore from './stores/authStore'
import { useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import SessionDetailPage from './pages/SessionDetailPage'
import ProfileSettingsPage from './pages/ProfileSettingsPage'

function App() {
  const { initializeAuth } = useAuthStore()


  useEffect(() => {
    initializeAuth()
  }, [])

  return (
    <>
      <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                duration: 4000,
              }}
            />

      <Routes>
        <Route path="/" element={<AuthRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/sessions/:id" element={<ProtectedRoute><SessionDetailPage /></ProtectedRoute>} />
        <Route path="/profile-settings" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<AuthRedirect/>} />
      </Routes>
    </>
  )
}


export default App