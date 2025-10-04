import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service in production
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    if (import.meta.env.PROD) {
      try {
        const Sentry = window.Sentry
        if (Sentry) {
          Sentry.captureException(error, {
            contexts: {
              react: {
                componentStack: errorInfo.componentStack,
              },
            },
            tags: {
              component: 'ErrorBoundary',
              type: 'react-error',
            },
          })
        }
      } catch (sentryError) {
        console.warn('Sentry monitoring unavailable:', sentryError)
      }
    }
  }

  render() {
    if (this.state.hasError) {
      // If a fallback prop is provided, use it
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Otherwise, use the default error UI
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <p>Please refresh the page and try again.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="button"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
