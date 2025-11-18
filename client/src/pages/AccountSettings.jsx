import axiosInstance from '../config/axiosInstance'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

import { useAuthStore } from '../store/useAuthStore'
import { Nav } from '../components/layout'

const AccountSettings = () => {
  const { logout, user } = useAuthStore()
  const [showModal, setShowModal] = useState(false)

  const userId = user?.user_id

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
        alert(response.data.message)
        // Optionally redirect to dashboard or stay on settings
        navigate('/dashboard')
      } else {
        // Account deleted immediately - log out
        logout()
        navigate('/')
      }
    } catch (err) {
      alert('Failed to delete account. Please try again.')
      setShowModal(false)
    }
  }

  const [activeScript, setActiveScript] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const scripts = {
      privacy: {
        id: 'enzuzo-privacy',
        src: 'https://app.enzuzo.com/scripts/privacy/a7f5fb04-1623-11f0-bcc9-df08c51d2550',
      },
      terms: {
        id: 'enzuzo-terms',
        src: 'https://app.enzuzo.com/scripts/tos/a7f5fb04-1623-11f0-bcc9-df08c51d2550',
      },
      cookie: {
        id: 'enzuzo-cookie',
        src: 'https://app.enzuzo.com/scripts/cookies/a7f5fb04-1623-11f0-bcc9-df08c51d2550',
      },
    }
    // Clear the container when activeScript changes
    if (!activeScript) return

    const container = containerRef.current
    if (container) {
      container.innerHTML = '' // Clear existing content (only where we control)
    }

    // Remove any previously inserted Enzuzo script
    Object.values(scripts).forEach(({ id }) => {
      const existing = document.getElementById(id)
      if (existing) existing.remove()
    })

    // Create and append the new script
    const scriptInfo = scripts[activeScript]
    const script = document.createElement('script')
    script.src = scriptInfo.src
    script.id = scriptInfo.id
    script.async = true
    containerRef.current.appendChild(script)

    // Cleanup script on unmount or switch
    return () => {
      script.remove()
    }
  }, [activeScript])

  return (
    <>
      <div className="background-color">
        <div className="overlay overlay-account-settings">
          <Nav minimal={true} />
          <div className="account-settings">
            <Link to="/dashboard">&lt;&lt; Back to Dashboard</Link>
            <Link onClick={() => setActiveScript('privacy')}>
              Privacy Policy
            </Link>
            <Link onClick={() => setActiveScript('terms')}>
              Terms Of Service
            </Link>
            <Link onClick={() => setActiveScript('cookie')}>Cookie Policy</Link>
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
            <div className="external-script-wrapper">
              <button
                className="close-icon"
                onClick={() => setActiveScript(null)}
                aria-label="Close"
                type="button"
              >
                &#x2715;
              </button>
              <div ref={containerRef} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
export default AccountSettings
