import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useChatStore } from '../../store/useChatStore'
import { UserPen, CircleUser, LogOut, Gem } from 'lucide-react'
import MessageCreditsDisplay from '../payment/MessageCreditsDisplay'

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
    <header className="header" role="banner">
      <div className="profile">
        <img
          className="avatar"
          src={user.imageUrl}
          alt={'Photo of ' + user.dogs_name}
          loading="lazy"
          decoding="async"
        />
        <h4>{user.dogs_name}</h4>
        {/* Message Credits Display */}
        <MessageCreditsDisplay />
      </div>

      {/* Hamburger Menu Button */}
      <button
        className={`hamburger-menu ${isMenuOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle navigation menu"
        aria-expanded={isMenuOpen}
        type="button"
      >
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <>
          <div
            className="menu-overlay"
            onClick={closeMenu}
            role="presentation"
            aria-hidden="true"
          ></div>
          <nav className="header-dropdown-menu" role="menu">
            <Link
              className="menu-item edit-dog-profile-link"
              to="/edit-profile"
              onClick={closeMenu}
              role="menuitem"
            >
              <UserPen aria-hidden="true" />
              &nbsp;Edit Profile
            </Link>
            <Link
              to="/account-settings"
              className="menu-item account-settings-link"
              onClick={closeMenu}
              role="menuitem"
            >
              <CircleUser aria-hidden="true" />
              &nbsp;Account
            </Link>
            <Link
              to="/pricing"
              className="menu-item pricing-link"
              onClick={closeMenu}
              role="menuitem"
            >
              <Gem aria-hidden="true" /> Upgrade
            </Link>
            <button
              className="menu-item log-out-link"
              onClick={userLogout}
              type="button"
              aria-label="Sign out"
            >
              <LogOut aria-hidden="true" />
              Sign Out
            </button>
          </nav>
        </>
      )}
    </header>
  )
}

export default Header
