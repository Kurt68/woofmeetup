import whiteLogo from '../images/woofmeetup_logo_pink.svg'
import pinkLogo from '../images/color-logo-woofmeetup.svg'
import { Link } from 'react-router-dom'

const Nav = ({ authToken, minimal, setShowModal, showModal, setIsSignUp }) => {
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
            src={minimal ? whiteLogo : pinkLogo}
            alt="Logo"
          />
        </Link>
      </div>
      {!authToken && !minimal && (
        <button
          className="nav-button"
          onClick={handleClick}
          disabled={showModal}
        >
          LOG IN
        </button>
      )}
    </nav>
  )
}

export default Nav
