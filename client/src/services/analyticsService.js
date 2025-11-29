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

export const initializeFacebookPixel = (pixelId) => {
  if (!pixelId) {
    console.warn('⚠️ Facebook Pixel ID not provided. Facebook Pixel disabled.')
    return
  }

  if (window.fbq) {
    console.warn('⚠️ Facebook Pixel already initialized')
    return
  }

  window.fbq = function() {
    window.fbq.callMethod
      ? window.fbq.callMethod.apply(window.fbq, arguments)
      : window.fbq.queue.push(arguments)
  }
  window.fbq.push = window.fbq
  window.fbq.loaded = true
  window.fbq.version = '2.0'
  window.fbq.queue = []

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)

  window.fbq('init', pixelId)
  window.fbq('track', 'PageView')
}

export const initializeGoogleAdsConversion = (conversionId) => {
  if (!conversionId) {
    console.warn(
      '⚠️ Google Ads Conversion ID not provided. Google Ads tracking disabled.'
    )
    return
  }

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${conversionId}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', conversionId)
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

export const trackConversion = (conversionName, conversionData = {}) => {
  const eventData = {
    ...conversionData,
    timestamp: new Date().toISOString(),
  }

  if (window.gtag) {
    window.gtag('event', 'conversion', {
      allow_custom_parameters: true,
      conversion_name: conversionName,
      ...eventData,
    })
  }

  if (window.fbq) {
    window.fbq('track', 'Subscribe', {
      content_name: conversionName,
      value: conversionData.value || 0,
      currency: conversionData.currency || 'USD',
      content_type: 'product',
      ...conversionData,
    })
  }
}

export const trackSignupConversion = () => {
  trackConversion('user_signup', {
    value: 0,
  })

  if (window.fbq) {
    window.fbq('track', 'CompleteRegistration')
  }

  if (window.gtag) {
    window.gtag('event', 'sign_up', {
      method: 'email',
    })
  }
}

export const trackFirstMessageConversion = () => {
  trackConversion('first_message', {
    value: 1,
  })

  if (window.fbq) {
    window.fbq('track', 'Contact')
  }
}

export const trackPaymentConversion = (amount, currency = 'USD') => {
  trackConversion('payment_completed', {
    value: amount,
    currency: currency,
  })

  if (window.fbq) {
    window.fbq('track', 'Purchase', {
      value: amount,
      currency: currency,
    })
  }

  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: `${Date.now()}`,
      value: amount,
      currency: currency,
    })
  }
}

export const trackAddToCartConversion = (plan, credits, price) => {
  if (window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_name: plan,
      content_category: 'credits',
      content_ids: [credits],
      value: price,
      currency: 'USD',
    })
  }

  if (window.gtag) {
    window.gtag('event', 'add_to_cart', {
      items: [
        {
          item_id: credits,
          item_name: plan,
          affiliation: 'Woof Meetup',
          price: price,
          quantity: 1,
        },
      ],
    })
  }
}

export const trackInitiateCheckoutConversion = (value) => {
  if (window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      value: value,
      currency: 'USD',
    })
  }

  if (window.gtag) {
    window.gtag('event', 'begin_checkout', {
      value: value,
      currency: 'USD',
    })
  }
}

export const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search)
  return {
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
    utm_content: params.get('utm_content') || null,
    utm_term: params.get('utm_term') || null,
  }
}

export const trackUTMParameters = () => {
  const utmParams = getUTMParams()

  if (Object.values(utmParams).some((v) => v !== null)) {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
        utm_content: utmParams.utm_content,
        utm_term: utmParams.utm_term,
      })
    }

    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: `Campaign: ${utmParams.utm_campaign}`,
        content_category: 'campaign',
      })
    }
  }
}
