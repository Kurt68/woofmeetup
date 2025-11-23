import {
  trackEvent,
  trackPageView,
  trackShareEvent,
  trackLinkCopyEvent,
  trackSignup,
  trackLogin,
  trackMessageSent,
  trackProfileLike,
  trackProfileMatch,
  trackPaymentCompleted,
  trackPaymentInitiated,
  trackDogProfileCreated,
  trackDogProfileUpdated,
  trackMeetupScheduled,
  trackChatInitiated,
  trackProfileViewed,
} from '../services/analyticsService'

export const useGA = () => {
  return {
    trackEvent,
    trackPageView,
    trackShareEvent,
    trackLinkCopyEvent,
    trackSignup,
    trackLogin,
    trackMessageSent,
    trackProfileLike,
    trackProfileMatch,
    trackPaymentCompleted,
    trackPaymentInitiated,
    trackDogProfileCreated,
    trackDogProfileUpdated,
    trackMeetupScheduled,
    trackChatInitiated,
    trackProfileViewed,
  }
}
