export const initializeGA = (measurementId) => {
  if (!measurementId) {
    console.warn(
      '⚠️ Google Analytics measurement ID not provided. Analytics disabled.'
    )
    return
  }

  if (window.gtag) {
    console.warn('⚠️ Google Analytics already initialized')
    return
  }

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', measurementId, {
    page_path: window.location.pathname,
  })
}

export const trackEvent = (eventName, eventData = {}) => {
  if (window.gtag) {
    window.gtag('event', eventName, eventData)
  }
}

export const trackPageView = (path, title) => {
  if (window.gtag) {
    window.gtag('config', undefined, {
      page_path: path,
      page_title: title,
    })
  }
}

export const trackShareEvent = (platform) => {
  trackEvent('share_initiated', {
    platform: platform,
    timestamp: new Date().toISOString(),
  })
}

export const trackLinkCopyEvent = () => {
  trackEvent('link_copied', {
    timestamp: new Date().toISOString(),
  })
}
