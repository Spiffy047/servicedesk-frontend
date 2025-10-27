import { useState } from 'react'
import NormalUserDashboard from './components/dashboards/NormalUserDashboard'
import TechnicalUserDashboard from './components/dashboards/TechnicalUserDashboard'
import TechnicalSupervisorDashboard from './components/dashboards/TechnicalSupervisorDashboard'
import SystemAdminDashboard from './components/dashboards/SystemAdminDashboard'

const API_URL = 'http://localhost:5002/api'

/**
 * Main App component - handles authentication and role-based dashboard routing
 * 
 * Flow:
 * 1. Shows login form if no user is authenticated
 * 2. Authenticates user via API and stores JWT token
 * 3. Routes to appropriate dashboard based on user role
 * 4. Provides logout functionality to clear session
 */
function App() {
  // Authentication state - tracks current user session
  const [user, setUser] = useState(null) // Current logged-in user object with role info
  
  // Login form state - manages form inputs and UI feedback
  const [email, setEmail] = useState('') // Email input field
  const [password, setPassword] = useState('') // Password input field
  const [error, setError] = useState('') // Login error messages
  const [loading, setLoading] = useState(false) // Loading state during login attempt

  // Handle user login with email/password authentication
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Send login credentials to backend API
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      setUser(data.user) // Store user info including role for dashboard routing
      localStorage.setItem('token', data.access_token) // Store JWT for API calls
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // Clear user session and return to login screen
  const handleLogout = () => {
    setUser(null)
    setEmail('')
    setPassword('')
    localStorage.removeItem('token') // Clear stored JWT token
  }

  // Show login form if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          {/* Login form header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">IT ServiceDesk</h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>
          
          {/* Login form with email/password fields */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email input field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@company.com"
                required
              />
            </div>

            {/* Password input field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                required
              />
            </div>

            {/* Error message display */}
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Submit button with loading state */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>


        </div>
      </div>
    )
  }

  // Route to appropriate dashboard based on user role
  // Each role has different permissions and sees different features
  switch (user.role) {
    case 'Normal User':
      // End users - can create tickets and view their own tickets
      return <NormalUserDashboard user={user} onLogout={handleLogout} />
    case 'Technical User':
      // IT agents - can view and work on assigned tickets
      return <TechnicalUserDashboard user={user} onLogout={handleLogout} />
    case 'Technical Supervisor':
      // Team leads - can manage agents and see team performance
      return <TechnicalSupervisorDashboard user={user} onLogout={handleLogout} />
    case 'System Admin':
      // Full admin access - can manage users, system settings, and analytics
      return <SystemAdminDashboard user={user} onLogout={handleLogout} />
    default:
      // Fallback to normal user dashboard for unknown roles
      return <NormalUserDashboard user={user} onLogout={handleLogout} />
  }
}

export default App
