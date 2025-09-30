import { useEffect, useRef } from 'react'

const TurnstileWidget = ({ siteKey, onSuccess, onError }) => {
  const widgetRef = useRef(null)

  useEffect(() => {
    const loadTurnstile = () => {
      if (window.turnstile && widgetRef.current) {
        window.turnstile.render(widgetRef.current, {
          sitekey: siteKey,
          callback: onSuccess,
          'error-callback': onError,
          theme: 'light',
          size: 'normal',
        })
      }
    }

    if (window.turnstile) {
      loadTurnstile()
    } else {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      script.onload = loadTurnstile
      document.head.appendChild(script)
    }

    // Capture the current ref value for cleanup
    const currentWidget = widgetRef.current

    return () => {
      if (window.turnstile && currentWidget) {
        window.turnstile.remove(currentWidget)
      }
    }
  }, [siteKey, onSuccess, onError])

  return <div ref={widgetRef}></div>
}

export default TurnstileWidget
