import { useEffect, useRef, useState } from 'react'

const TurnstileWidget = ({ onSuccess, onError, siteKey }) => {
  const widgetRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [widgetId, setWidgetId] = useState(null)
  const [isRendering, setIsRendering] = useState(false)

  // Callback ref to handle when the DOM element becomes available
  const setWidgetRef = (element) => {
    widgetRef.current = element
    console.log('TurnstileWidget: Element ref set', {
      element: !!element,
      scriptLoaded,
      turnstileAvailable: !!window.turnstile,
      widgetId,
      error,
      isRendering,
    })

    if (
      element &&
      scriptLoaded &&
      window.turnstile &&
      !widgetId &&
      !error &&
      !isRendering
    ) {
      console.log('TurnstileWidget: All conditions met, attempting to render')
      renderWidget()
    } else if (
      element &&
      window.turnstile &&
      !widgetId &&
      !error &&
      !isRendering
    ) {
      // Fallback: if turnstile is available but scriptLoaded state hasn't updated
      console.log(
        'TurnstileWidget: Fallback render attempt (script loaded but state not updated)'
      )
      renderWidget()
    }
  }

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

    // Check if script is already loaded
    if (window.turnstile) {
      console.log('TurnstileWidget: Script already loaded')
      setScriptLoaded(true)
      setIsLoading(false) // Allow the component to render the DOM element
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="turnstile"]')
    if (existingScript) {
      console.log('TurnstileWidget: Script is already loading, waiting...')
      existingScript.addEventListener('load', () => {
        console.log('TurnstileWidget: Existing script loaded successfully')
        setScriptLoaded(true)
        setIsLoading(false) // Allow the component to render the DOM element
      })
      return
    }

    // Load Turnstile script
    console.log('TurnstileWidget: Loading Cloudflare Turnstile script...')
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true

    script.onload = () => {
      console.log('TurnstileWidget: Script loaded successfully')
      setScriptLoaded(true)
      setIsLoading(false) // Allow the component to render the DOM element
    }

    script.onerror = (e) => {
      const errorMsg = 'Failed to load Cloudflare Turnstile script'
      console.error('TurnstileWidget:', errorMsg, e)
      setError(errorMsg)
      setIsLoading(false)
      if (onError) onError()
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup widget on unmount
      if (window.turnstile && widgetId) {
        try {
          console.log('TurnstileWidget: Cleaning up widget with ID:', widgetId)
          window.turnstile.remove(widgetId)
          setWidgetId(null)
          setIsRendering(false)
        } catch (error) {
          console.warn('TurnstileWidget: Error removing widget:', error)
        }
      }
    }
  }, [siteKey])

  // Effect to handle when script loads after DOM element is already created
  useEffect(() => {
    if (
      scriptLoaded &&
      widgetRef.current &&
      window.turnstile &&
      !widgetId &&
      !error &&
      !isRendering
    ) {
      console.log(
        'TurnstileWidget: Script loaded after DOM ready, attempting to render'
      )
      renderWidget()
    }
  }, [scriptLoaded])

  const renderWidget = () => {
    if (isRendering || widgetId) {
      console.log(
        'TurnstileWidget: Already rendering or widget exists, skipping'
      )
      return
    }

    if (!window.turnstile) {
      console.error('TurnstileWidget: window.turnstile is not available')
      setError('Turnstile script not loaded')
      return
    }

    if (!widgetRef.current) {
      console.error('TurnstileWidget: Widget container ref is not available')
      setError('Widget container not ready')
      return
    }

    // Check if widget already exists in the container
    if (widgetRef.current.children.length > 0) {
      console.log(
        'TurnstileWidget: Widget already exists in container, clearing first'
      )
      widgetRef.current.innerHTML = ''
    }

    setIsRendering(true)

    try {
      console.log('TurnstileWidget: Rendering widget with siteKey:', siteKey)

      const renderedWidgetId = window.turnstile.render(widgetRef.current, {
        sitekey: siteKey,
        callback: (token) => {
          console.log(
            'TurnstileWidget: Verification successful, token received'
          )
          setError(null)
          if (onSuccess) onSuccess(token)
        },
        'error-callback': (errorCode) => {
          const errorMsg = `Turnstile verification failed with error code: ${errorCode}`
          console.error('TurnstileWidget:', errorMsg)
          setError(errorMsg)
          setIsRendering(false)
          if (onError) onError(errorCode)
        },
        'expired-callback': () => {
          console.warn('TurnstileWidget: Token expired')
          setError('Verification expired, please try again')
          setIsRendering(false)
        },
        'timeout-callback': () => {
          console.warn('TurnstileWidget: Verification timed out')
          setError('Verification timed out, please try again')
          setIsRendering(false)
        },
      })

      console.log('TurnstileWidget: Widget rendered with ID:', renderedWidgetId)
      setWidgetId(renderedWidgetId)
      setError(null)
      setIsRendering(false)
    } catch (error) {
      const errorMsg = `Error rendering Turnstile widget: ${error.message}`
      console.error('TurnstileWidget:', errorMsg, error)
      setError(errorMsg)
      setIsRendering(false)
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

  const resetWidget = () => {
    if (window.turnstile && widgetId) {
      try {
        window.turnstile.remove(widgetId)
      } catch (error) {
        console.warn(
          'TurnstileWidget: Error removing widget during reset:',
          error
        )
      }
    }
    setWidgetId(null)
    setError(null)
    setIsRendering(false)

    // Clear the container
    if (widgetRef.current) {
      widgetRef.current.innerHTML = ''
    }

    // Re-render after a short delay
    setTimeout(() => {
      if (widgetRef.current && window.turnstile && !widgetId && !isRendering) {
        renderWidget()
      }
    }, 100)
  }

  // Show error state
  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#d32f2f' }}>
        <div>⚠️ Verification Error</div>
        <div style={{ fontSize: '12px', marginTop: '5px' }}>{error}</div>
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={resetWidget}
            style={{
              marginRight: '10px',
              padding: '5px 10px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return <div ref={setWidgetRef}></div>
}

export default TurnstileWidget
