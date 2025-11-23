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

export const trackSignup = (method = 'email') => {
  trackEvent('user_signup', {
    method: method,
    timestamp: new Date().toISOString(),
  })
}

export const trackLogin = () => {
  trackEvent('user_login', {
    timestamp: new Date().toISOString(),
  })
}

export const trackMessageSent = (creditsUsed = 1) => {
  trackEvent('message_sent', {
    credits_used: creditsUsed,
    timestamp: new Date().toISOString(),
  })
}

export const trackProfileLike = () => {
  trackEvent('profile_liked', {
    timestamp: new Date().toISOString(),
  })
}

export const trackProfileMatch = () => {
  trackEvent('profile_matched', {
    timestamp: new Date().toISOString(),
  })
}

export const trackPaymentCompleted = (amount, plan) => {
  trackEvent('payment_completed', {
    value: amount,
    plan: plan,
    timestamp: new Date().toISOString(),
  })
}

export const trackPaymentInitiated = (amount, plan) => {
  trackEvent('payment_initiated', {
    value: amount,
    plan: plan,
    timestamp: new Date().toISOString(),
  })
}

export const trackDogProfileCreated = () => {
  trackEvent('dog_profile_created', {
    timestamp: new Date().toISOString(),
  })
}

export const trackDogProfileUpdated = () => {
  trackEvent('dog_profile_updated', {
    timestamp: new Date().toISOString(),
  })
}

export const trackMeetupScheduled = (meetupType) => {
  trackEvent('meetup_scheduled', {
    meetup_type: meetupType,
    timestamp: new Date().toISOString(),
  })
}

export const trackChatInitiated = (recipientId) => {
  trackEvent('chat_initiated', {
    recipient_id: recipientId,
    timestamp: new Date().toISOString(),
  })
}

export const trackProfileViewed = () => {
  trackEvent('profile_viewed', {
    timestamp: new Date().toISOString(),
  })
}
