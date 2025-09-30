import { useChatStore } from '../../store/useChatStore'
import { useAuthStore } from '../../store/useAuthStore'

const ChatSidebar = (clickedUser) => {
  const { selectedUser, setSelectedUser } = useChatStore()

  const { onlineUsers } = useAuthStore()

  const currentClickedUser = [...Object.values(clickedUser)]

  return (
    <aside className="online">
      {currentClickedUser.map((user) => (
        <button
          key={user._id}
          onClick={() => setSelectedUser(user)}
          className={`
             background-button
              ${
                selectedUser?._id === user._id
                  ? 'background-button-selected'
                  : ''
              }
            `}
        >
          <img
            src={user.imageUrl || '/avatar.png'}
            alt={user.userName}
            className="avatar"
          />

          <div className="status">
            <p className="offline-online">
              <strong>{user.userName}</strong>
            </p>
            <p className="offline-online">
              {onlineUsers.includes(user._id) ? 'Online' : 'Offline'}
            </p>
            {onlineUsers.includes(user._id) && (
              <div className="online-users">
                <span className="blink"></span>
              </div>
            )}
          </div>
        </button>
      ))}
    </aside>
  )
}
export default ChatSidebar
