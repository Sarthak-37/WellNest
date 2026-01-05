import { Navigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'

const AuthRedirect = ({ element }) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
    </div>
  );
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
}

export default AuthRedirect