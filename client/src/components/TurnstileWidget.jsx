import { useEffect, useRef } from 'react'

const TurnstileWidget = ({ onSuccess, onError, siteKey }) => {
  const widgetRef = useRef(null)

  useEffect(() => {
    // Load Turnstile script if not already loaded
    if (!window.turnstile) {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      script.onload = () => {
        renderWidget()
      }
      document.head.appendChild(script)
    } else {
      renderWidget()
    }

    return () => {
      // Cleanup widget on unmount
      if (window.turnstile && widgetRef.current) {
        try {
          window.turnstile.remove(widgetRef.current)
        } catch (error) {
          console.warn('Error removing Turnstile widget:', error)
        }
      }
    }
  }, [])

  const renderWidget = () => {
    if (window.turnstile && widgetRef.current) {
      try {
        window.turnstile.render(widgetRef.current, {
          sitekey: siteKey,
          callback: onSuccess,
          'error-callback': onError,
        })
      } catch (error) {
        console.error('Error rendering Turnstile widget:', error)
        onError()
      }
    }
  }

  return <div ref={widgetRef}></div>
}

export default TurnstileWidget
