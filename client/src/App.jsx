import { lazy, Suspense } from 'react'

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/useAuthStore'
import { useEffect } from 'react'
import { LoadingSpinner, ErrorBoundary } from './components/ui'
import { fetchCsrfToken } from './services/csrfService'
import { setAxiosLogoutHandler } from './config/axiosInstance'
import { trackPageView } from './services/analyticsService'

// Protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />
  }

  if (!user.isVerified) {
    return <Navigate to="/verify-email" replace />
  }

  // Check if user has completed onboarding (has required profile fields)
  const hasCompletedOnboarding =
    user.dogs_name && user.age && user.about && user.userAbout
  if (!hasCompletedOnboarding) {
    return children
  }

  return children
}

// redirect authenticated users to the dashboard
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && user?.isVerified) {
    console.log('🚀 [RedirectAuthenticatedUser] Redirecting to /dashboard')
    return <Navigate to="/dashboard" replace />
  }
  return children
}
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const EditDogProfile = lazy(() => import('./pages/EditDogProfile'))
const AccountSettings = lazy(() => import('./pages/AccountSettings'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const EmailVerification = lazy(() => import('./pages/EmailVerification'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'))
const Home = lazy(() => import('./pages/Home'))
const PublicProfile = lazy(() => import('./pages/PublicProfile'))

const LocationTracker = () => {
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname, document.title)
  }, [location.pathname])

  return null
}

const App = () => {
  const { isCheckingAuth, checkAuth, logout } = useAuthStore()

  useEffect(() => {
    // Initialize CSRF token first (required for all state-changing requests)
    fetchCsrfToken().catch((error) => {
      console.error('⚠️ Failed to initialize CSRF token:', error)
      // Continue anyway - CSRF token will be fetched but may fail on requests
    })

    // Set up global 401 handler for session expiration
    setAxiosLogoutHandler(() => {
      logout().catch((err) => {
        console.error('Error during auto-logout:', err)
      })
    })

    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isCheckingAuth) {
    return (
      <>
        <LoadingSpinner />
      </>
    )
  }

  return (
    <>
      <BrowserRouter>
        <LocationTracker />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route
              path="/"
              element={
                <RedirectAuthenticatedUser>
                  <Home />
                </RedirectAuthenticatedUser>
              }
            />

            <Route
              path="/profile/:userId"
              element={
                <ErrorBoundary>
                  <PublicProfile />
                </ErrorBoundary>
              }
            />

            <Route path="/verify-email" element={<EmailVerification />} />

            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Onboarding />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route
              path="/edit-profile"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <EditDogProfile />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route
              path="/account-settings"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <AccountSettings />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pricing"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <PricingPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route
              path="/payment-success"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <PaymentSuccess />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster
          toastOptions={{
            style: {
              background: '#fff',
              color: '#333',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '3px',
            },
            success: {
              style: {
                background: '#fff',
                color: '#333',
              },
              iconTheme: {
                primary: '#ffc0cb',
                secondary: '#fff',
              },
            },
            error: {
              style: {
                background: '#fff',
                color: '#333',
              },
            },
            loading: {
              iconTheme: {
                primary: '#ec4899',
                secondary: '#fff',
              },
            },
            default: {
              iconTheme: {
                primary: '#ec4899',
                secondary: '#fff',
              },
            },
          }}
        />
      </BrowserRouter>
    </>
  )
}

export default App
