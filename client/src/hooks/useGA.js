import { trackEvent, trackPageView, trackShareEvent, trackLinkCopyEvent } from '../services/analyticsService'

export const useGA = () => {
  return {
    trackEvent,
    trackPageView,
    trackShareEvent,
    trackLinkCopyEvent,
  }
}
