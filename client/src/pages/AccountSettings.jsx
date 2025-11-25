import axiosInstance from '../config/axiosInstance'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'

import { useAuthStore } from '../store/useAuthStore'
import { Nav } from '../components/layout'
import { PageHead } from '../components/PageHead'

const SCRIPT_CONFIG = {
  privacy: {
    id: 'enzuzo-privacy',
    src: 'https://app.enzuzo.com/scripts/privacy/a7f5fb04-1623-11f0-bcc9-df08c51d2550',
    label: 'Privacy Policy',
  },
  terms: {
    id: 'enzuzo-terms',
    src: 'https://app.enzuzo.com/scripts/tos/a7f5fb04-1623-11f0-bcc9-df08c51d2550',
    label: 'Terms of Service',
  },
  cookie: {
    id: 'enzuzo-cookie',
    src: 'https://app.enzuzo.com/scripts/cookies/a7f5fb04-1623-11f0-bcc9-df08c51d2550',
    label: 'Cookie Policy',
  },
}

const MAX_RETRIES = 2
const SCRIPT_TIMEOUT = 8000

const AccountSettings = () => {
  const { logout, user, updateProfileVisibility } = useAuthStore()
  const [showModal, setShowModal] = useState(false)
  const [isProfilePublic, setIsProfilePublic] = useState(
    user?.isProfilePublic ?? true
  )
  const [visibilityLoading, setVisibilityLoading] = useState(false)
  const [showVisibilityBanner, setShowVisibilityBanner] = useState(false)

  useEffect(() => {
    const bannerDismissed = localStorage.getItem(
      'profileVisibilityBannerDismissed'
    )
    if (!bannerDismissed) {
      setShowVisibilityBanner(true)
    }
  }, [])

  const userId = user?.user_id

  const handleDismissBanner = () => {
    setShowVisibilityBanner(false)
    localStorage.setItem('profileVisibilityBannerDismissed', 'true')
  }

  const handleVisibilityToggle = async (e) => {
    e.preventDefault()
    setVisibilityLoading(true)
    try {
      const newValue = !isProfilePublic
      await updateProfileVisibility(userId, newValue)
      setIsProfilePublic(newValue)
      const status = newValue ? 'public' : 'private'
      toast.success(`Profile is now ${status}`, { duration: 3000 })
    } catch (err) {
      toast.error('Failed to update profile visibility', { duration: 3000 })
    } finally {
      setVisibilityLoading(false)
    }
  }

  const deleteClick = () => {
    setShowModal(true)
  }

  const cancelDelete = () => {
    setShowModal(false)
  }
  let navigate = useNavigate()

  const deleteOneUser = async () => {
    try {
      const response = await axiosInstance.delete('/api/auth/delete-one-user', {
        params: { userId },
      })

      setShowModal(false)

      // Check if deletion was scheduled or immediate
      if (response.data.scheduled) {
        // Account scheduled for deletion - show message and keep user logged in
        toast.success(response.data.message, { duration: 6000 })
        // Optionally redirect to dashboard or stay on settings
        navigate('/dashboard')
      } else {
        // Account deleted immediately - log out
        logout()
        navigate('/')
      }
    } catch (err) {
      toast.error('Failed to delete account. Please try again.', { duration: 6000 })
      setShowModal(false)
    }
  }

  const [activeScript, setActiveScript] = useState(null)
  const [scriptError, setScriptError] = useState(null)
  const [scriptLoading, setScriptLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const containerRef = useRef(null)
  const scriptTimeoutRef = useRef(null)
  const debounceTimerRef = useRef(null)

  const cleanupGlobalState = useCallback(() => {
    // Clean up Enzuzo global state to prevent memory leaks
    if (window.enzuzoPrivacy) delete window.enzuzoPrivacy
    if (window.enzuzoTos) delete window.enzuzoTos
    if (window.enzuzoCookies) delete window.enzuzoCookies
  }, [])

  const loadScript = useCallback(
    async (scriptKey) => {
      if (!scriptKey) return

      setScriptLoading(true)
      setScriptError(null)

      try {
        const container = containerRef.current
        if (!container) throw new Error('Container not found')

        // Clear previous content and scripts
        container.innerHTML = ''
        Object.values(SCRIPT_CONFIG).forEach(({ id }) => {
          const existing = document.getElementById(id)
          if (existing) existing.remove()
        })

        cleanupGlobalState()

        const scriptInfo = SCRIPT_CONFIG[scriptKey]
        if (!scriptInfo) throw new Error(`Invalid script: ${scriptKey}`)

        // Create script element with security attributes
        const script = document.createElement('script')
        script.src = scriptInfo.src
        script.id = scriptInfo.id
        script.async = true
        script.type = 'text/javascript'

        // Set a timeout for script load
        scriptTimeoutRef.current = setTimeout(() => {
          setScriptError(`${scriptInfo.label} took too long to load`)
          setScriptLoading(false)
          script.remove()
        }, SCRIPT_TIMEOUT)

        script.onload = () => {
          clearTimeout(scriptTimeoutRef.current)
          setScriptLoading(false)
          setRetryCount(0)
        }

        script.onerror = () => {
          clearTimeout(scriptTimeoutRef.current)
          if (retryCount < MAX_RETRIES) {
            setRetryCount((prev) => prev + 1)
            loadScript(scriptKey)
          } else {
            setScriptError(`Failed to load ${scriptInfo.label}. Please try again.`)
            setScriptLoading(false)
          }
        }

        container.appendChild(script)
      } catch (error) {
        setScriptError(
          error instanceof Error
            ? error.message
            : 'An error occurred loading the document'
        )
        setScriptLoading(false)
      }
    },
    [retryCount, cleanupGlobalState]
  )

  const handleScriptSelection = useCallback((scriptKey) => {
    // Debounce rapid script switches
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setActiveScript(scriptKey)
      setRetryCount(0)
      setScriptError(null)
    }, 100)
  }, [])

  useEffect(() => {
    if (activeScript) {
      loadScript(activeScript)
    } else {
      setScriptLoading(false)
      setScriptError(null)
      cleanupGlobalState()
    }

    return () => {
      if (scriptTimeoutRef.current) {
        clearTimeout(scriptTimeoutRef.current)
      }
    }
  }, [activeScript, loadScript, cleanupGlobalState])

  return (
    <>
      <PageHead
        title="Account Settings"
        description="Manage your Woof Meetup account settings, preferences, and security."
      />
      <div className="background-color">
        <div className="overlay">
          <Nav minimal={true} />

          {showVisibilityBanner && (
            <div className="profile-visibility-banner">
              <div className="banner-content">
                <p>
                  <strong>Your profile is currently public</strong> on Woof
                  Meetup. This helps other dog lovers discover you for meetups.
                  You can change your privacy preference anytime using the
                  toggle.
                </p>
              </div>
              <button
                className="banner-close-button"
                onClick={handleDismissBanner}
                aria-label="Dismiss banner"
                type="button"
              >
                ✕
              </button>
            </div>
          )}

          <div className="account-settings">
            <Link to="/dashboard">&lt;&lt; Back to Dashboard</Link>
            <label className="profile-visibility-toggle">
              <input
                type="checkbox"
                checked={isProfilePublic}
                onChange={handleVisibilityToggle}
                disabled={visibilityLoading}
              />
              <span>
                {isProfilePublic ? 'Profile is Public' : 'Profile is Private'}
              </span>
            </label>
            <Link onClick={() => handleScriptSelection('privacy')}>
              Privacy Policy
            </Link>
            <Link onClick={() => handleScriptSelection('terms')}>
              Terms Of Service
            </Link>
            <Link onClick={() => handleScriptSelection('cookie')}>Cookie Policy</Link>
            <Link
              className="primary-button delete-button"
              onClick={deleteClick}
            >
              Delete Account
            </Link>

            {showModal && (
              <div
                className="auth-modal delete"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-account-heading"
              >
                <button
                  className="close-icon"
                  onClick={cancelDelete}
                  aria-label="Close modal"
                  type="button"
                >
                  &#x2715;
                </button>
                <h2 id="delete-account-heading">Delete Account</h2>
                <p>Are you sure you want to delete your account?</p>

                <div className="deletion-policy">
                  <h3>Account Deletion Policy</h3>
                  <ol>
                    <li>
                      <strong>Active Subscription:</strong> Your account will be
                      scheduled for deletion when your subscription ends. You'll
                      retain full access to premium features until then.
                    </li>
                    <li>
                      <strong>Credits Only:</strong> Your account will be
                      scheduled for deletion in 30 days. You can continue using
                      your remaining credits during this time.
                    </li>
                    <li>
                      <strong>Free Account:</strong> Your account will be
                      deleted immediately.
                    </li>
                    <li>
                      No refunds will be issued for unused credits or partial
                      subscription periods.
                    </li>
                    <li>
                      All messages, matches, and profile data will be
                      permanently deleted when the scheduled date arrives.
                    </li>
                    <li>
                      Credits cannot be transferred to a new account if you
                      re-register.
                    </li>
                  </ol>
                </div>

                <button className="primary-button" onClick={deleteOneUser}>
                  Yes, Delete
                </button>
                <button className="secondary-button" onClick={cancelDelete}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          {activeScript && (
            <div className="external-script-modal-overlay">
              <div className="external-script-modal">
                <div className="external-script-modal-header">
                  <h3 className="external-script-modal-title">
                    {SCRIPT_CONFIG[activeScript]?.label}
                  </h3>
                  <button
                    className="external-script-close-icon"
                    onClick={() => setActiveScript(null)}
                    aria-label="Close"
                    type="button"
                  >
                    &#x2715;
                  </button>
                </div>

                <div className="external-script-modal-scroll">
                  {scriptLoading && (
                    <div className="script-loading">
                      <p>Loading {SCRIPT_CONFIG[activeScript]?.label}...</p>
                    </div>
                  )}

                  {scriptError && (
                    <div className="script-error">
                      <p>⚠️ {scriptError}</p>
                      {retryCount < MAX_RETRIES && (
                        <button
                          className="secondary-button"
                          onClick={() => handleScriptSelection(activeScript)}
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  )}

                  <div ref={containerRef} />
                </div>

                <div className="external-script-modal-footer" />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
export default AccountSettings
