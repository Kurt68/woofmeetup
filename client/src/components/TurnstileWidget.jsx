import { useEffect, useRef, useState } from 'react'

const TurnstileWidget = ({ onSuccess, onError, siteKey }) => {
  const widgetRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    console.log('TurnstileWidget: Initializing with siteKey:', siteKey)

    // Validate site key
    if (!siteKey) {
      const errorMsg =
        'Turnstile site key is missing. Please check your environment variables.'
      console.error('TurnstileWidget:', errorMsg)
      setError(errorMsg)
      setIsLoading(false)
      return
    }

    // Load Turnstile script if not already loaded
    if (!window.turnstile) {
      console.log('TurnstileWidget: Loading Cloudflare Turnstile script...')
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true

      script.onload = () => {
        console.log('TurnstileWidget: Script loaded successfully')
        setScriptLoaded(true)
        renderWidget()
      }

      script.onerror = (e) => {
        const errorMsg = 'Failed to load Cloudflare Turnstile script'
        console.error('TurnstileWidget:', errorMsg, e)
        setError(errorMsg)
        setIsLoading(false)
        if (onError) onError()
      }

      document.head.appendChild(script)
    } else {
      console.log('TurnstileWidget: Script already loaded, rendering widget')
      setScriptLoaded(true)
      renderWidget()
    }

    return () => {
      // Cleanup widget on unmount
      if (window.turnstile && widgetRef.current) {
        try {
          console.log('TurnstileWidget: Cleaning up widget')
          window.turnstile.remove(widgetRef.current)
        } catch (error) {
          console.warn('TurnstileWidget: Error removing widget:', error)
        }
      }
    }
  }, [siteKey])

  const renderWidget = () => {
    if (!window.turnstile) {
      console.error('TurnstileWidget: window.turnstile is not available')
      setError('Turnstile script not loaded')
      setIsLoading(false)
      return
    }

    if (!widgetRef.current) {
      console.error('TurnstileWidget: Widget container ref is not available')
      setError('Widget container not ready')
      setIsLoading(false)
      return
    }

    try {
      console.log('TurnstileWidget: Rendering widget with siteKey:', siteKey)

      const widgetId = window.turnstile.render(widgetRef.current, {
        sitekey: siteKey,
        callback: (token) => {
          console.log(
            'TurnstileWidget: Verification successful, token received'
          )
          setIsLoading(false)
          setError(null)
          if (onSuccess) onSuccess(token)
        },
        'error-callback': (errorCode) => {
          const errorMsg = `Turnstile verification failed with error code: ${errorCode}`
          console.error('TurnstileWidget:', errorMsg)
          setError(errorMsg)
          setIsLoading(false)
          if (onError) onError(errorCode)
        },
        'expired-callback': () => {
          console.warn('TurnstileWidget: Token expired')
          setError('Verification expired, please try again')
          setIsLoading(false)
        },
        'timeout-callback': () => {
          console.warn('TurnstileWidget: Verification timed out')
          setError('Verification timed out, please try again')
          setIsLoading(false)
        },
      })

      console.log('TurnstileWidget: Widget rendered with ID:', widgetId)
      setIsLoading(false)
      setError(null)
    } catch (error) {
      const errorMsg = `Error rendering Turnstile widget: ${error.message}`
      console.error('TurnstileWidget:', errorMsg, error)
      setError(errorMsg)
      setIsLoading(false)
      if (onError) onError(error)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading security verification...</div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          {!scriptLoaded
            ? 'Loading Cloudflare Turnstile...'
            : 'Initializing widget...'}
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#d32f2f' }}>
        <div>⚠️ Verification Error</div>
        <div style={{ fontSize: '12px', marginTop: '5px' }}>{error}</div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '10px',
            padding: '5px 10px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Refresh Page
        </button>
      </div>
    )
  }

  return <div ref={widgetRef}></div>
}

export default TurnstileWidget
