import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

import { useCookies } from 'react-cookie'
import { useAuthStore } from '../store/useAuthStore'
import { Nav } from '../components/layout'

const API_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000/api/auth'
    : '/api/auth'

const AccountSettings = () => {
  const { logout } = useAuthStore()
  const [cookies] = useCookies('user')
  const [showModal, setShowModal] = useState(false)

  const userId = cookies.UserId

  const deleteClick = () => {
    setShowModal(true)
  }

  const cancelDelete = () => {
    setShowModal(false)
  }
  let navigate = useNavigate()

  const deleteOneUser = async () => {
    try {
      await axios.delete(`${API_URL}/delete-one-user`, {
        params: { userId },
      })
      navigate('/')
    } catch (err) {
      console.log(err)
    } finally {
      setShowModal(false)
    }
    logout()
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
              <div className="auth-modal delete">
                <div className="close-icon" onClick={cancelDelete}>
                  &#x2715;
                </div>
                <p>Are you sure you want to delete your account?</p>
                <button className="primary-button" onClick={deleteOneUser}>
                  Yes, Delete
                </button>
                <button className="secondary-button" onClick={cancelDelete}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div ref={containerRef} />
        </div>
      </div>
    </>
  )
}
export default AccountSettings
