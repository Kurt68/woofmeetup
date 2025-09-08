import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useChatStore } from '../store/useChatStore'


const Header = ({ user }) => {
  const { logout } = useAuthStore()
    const { setSelectedUser } = useChatStore()
  

  const userLogout = () => {
    logout()
    setSelectedUser(null)
  }

  return (
    <div className="header">
      <div className="profile">
        <span title="Log Out" className="log-out-icon" onClick={userLogout}>
          &larr; Sign Out
        </span>
        <Link to="/account-settings" className="account-settings-link">
          Account Stuff
        </Link>

        <img
          className="avatar"
          src={user.imageUrl}
          alt={'photo of ' + user.dogs_name}
        />
        <h3>{user.dogs_name}</h3>
        <Link className="edit-dog-profile" to="/edit-dog-profile">
          <i className="edit-icon">&#9998;</i>
          <span>Edit Profile</span>
        </Link>
      </div>
    </div>
  )
}

export default Header
