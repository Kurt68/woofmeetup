import whiteLogo from '../../images/woofmeetup_logo_pink.svg'
import pinkLogo from '../../images/color-logo-woofmeetup.svg'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore.js'

/**
 * Navigation Component
 * Displays logo and login button based on authentication state
 *
 * Props:
 * - minimal: boolean - Use compact logo styling (pink instead of white)
 * - setShowModal: function - Open/close auth modal
 * - setIsSignUp: function - Toggle between signup/login modes
 */
const Nav = ({ minimal, setShowModal, setIsSignUp }) => {
  const { isAuthenticated } = useAuthStore()

  const handleClick = () => {
    setShowModal(true)
    setIsSignUp(false)
  }

  return (
    <nav>
      <div className="logo-container">
        <Link to="/dashboard">
          <img
            className="logo"
            src={minimal ? pinkLogo : whiteLogo}
            alt="Logo"
          />
        </Link>
      </div>
      {!isAuthenticated && !minimal && (
        <button className="nav-button" onClick={handleClick} disabled={false}>
          LOG IN
        </button>
      )}
    </nav>
  )
}

export default Nav
