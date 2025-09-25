import { useChatStore } from '../store/useChatStore'
import Header from './Header'
import ChatWindow from './ChatWindow'
import ChatModal from './ChatModal'
import ChatSidebar from './ChatSidebar'
import MatchesDisplay from './MatchesDisplay'
import useIsMobile from '../hooks/useIsMobile'
import { useState } from 'react'

const ChatContainer = ({ user }) => {
  const [clickedUser, setClickedUser] = useState(null)
  const { selectedUser, setSelectedUser } = useChatStore()
  const isMobile = useIsMobile()

  const handleClick = () => {
    setClickedUser(null)
    setSelectedUser(null)
  }

  return (
    <div className="header-chat-container">
      <Header user={user} />

      <button
        className="option matches"
        disabled={!clickedUser}
        onClick={handleClick}
      >
        Matches
      </button>

      {!clickedUser && (
        <MatchesDisplay
          matches={user.matches}
          setClickedUser={setClickedUser}
        />
      )}

      {clickedUser && <ChatSidebar clickedUser={clickedUser} />}
      {selectedUser && !isMobile && <ChatWindow user={user} />}
      {selectedUser && isMobile && <ChatModal user={user} />}
    </div>
  )
}

export default ChatContainer
