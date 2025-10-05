import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { ErrorBoundary, ErrorComponent } from './components/ui'

// Initialize Sentry with dynamic import to avoid production build issues
async function initializeSentry() {
  try {
    const { init, browserTracingIntegration, replayIntegration } = await import(
      '@sentry/react'
    )

    init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        browserTracingIntegration(),
        replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0, // Capture 100% of the transactions
      // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
      // Session Replay
      replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
      replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
    })

    // Make Sentry available globally for other components
    const Sentry = await import('@sentry/react')
    window.Sentry = Sentry

    console.log('Sentry initialized successfully')
  } catch (error) {
    console.warn('Failed to initialize Sentry:', error)
  }
}

// Initialize Sentry
initializeSentry()

// Register service worker for caching optimization
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<ErrorComponent />}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
