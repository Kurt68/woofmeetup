import { lazy, Suspense } from 'react'

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/useAuthStore'
import { useEffect } from 'react'
import { LoadingSpinner } from './components/ui'
import SentryTestButtons from './components/SentryTestButtons'

// Protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (!user.isVerified) {
    return <Navigate to="/verify-email" replace />
  }
  return children
}

// redirect authenticated users to the dashboard
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && user.isVerified) {
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
const Home = lazy(() => import('./pages/Home'))

const App = () => {
  const { isCheckingAuth, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

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

            <Route path="/verify-email" element={<EmailVerification />} />

            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/forgot-password"
              element={
                <RedirectAuthenticatedUser>
                  <ForgotPassword />
                </RedirectAuthenticatedUser>
              }
            />
            <Route
              path="/reset-password/:token"
              element={
                <RedirectAuthenticatedUser>
                  <ResetPassword />
                </RedirectAuthenticatedUser>
              }
            />
            <Route
              path="/edit-dog-profile"
              element={
                <ProtectedRoute>
                  <EditDogProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/account-settings"
              element={
                <ProtectedRoute>
                  <AccountSettings />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster
          toastOptions={{
            success: {
              iconTheme: {
                primary: 'pink',
              },
            },
          }}
        />
        {/* <SentryTestButtons /> */}
      </BrowserRouter>
    </>
  )
}

export default App
