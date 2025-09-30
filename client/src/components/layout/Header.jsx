import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useChatStore } from '../../store/useChatStore'

const Header = ({ user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { logout } = useAuthStore()
  const { setSelectedUser } = useChatStore()

  const userLogout = () => {
    logout()
    setSelectedUser(null)
    setIsMenuOpen(false)
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <div className="header">
      <div className="profile">
        <img
          className="avatar"
          src={user.imageUrl}
          alt={'photo of ' + user.dogs_name}
        />
        <h4>{user.dogs_name}</h4>
      </div>

      {/* Hamburger Menu Button */}
      <button
        className={`hamburger-menu ${isMenuOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <>
          <div className="menu-overlay" onClick={closeMenu}></div>
          <div className="dropdown-menu">
            <Link
              className="menu-item edit-dog-profile-link"
              to="/edit-dog-profile"
              onClick={closeMenu}
            >
              <i className="edit-icon">&#9998;</i> Edit Profile
            </Link>
            <Link
              to="/account-settings"
              className="menu-item account-settings-link"
              onClick={closeMenu}
            >
              <i className="account-icon">&#9881;</i> Account
            </Link>
            <span
              title="Log Out"
              className="menu-item log-out-link"
              onClick={userLogout}
            >
              &nbsp; &larr; Sign Out
            </span>
          </div>
        </>
      )}
    </div>
  )
}

export default Header
