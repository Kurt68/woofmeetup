import { useChatStore } from '../store/useChatStore'
import Header from './Header'
import ChatWindow from './ChatWindow'
import ChatSidebar from './ChatSidebar'
import MatchesDisplay from './MatchesDisplay'
import { useState } from 'react'

const ChatContainer = ({ user }) => {
  const [clickedUser, setClickedUser] = useState(null)
  const { selectedUser, setSelectedUser } = useChatStore()


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

      {clickedUser && <ChatSidebar clickedUser={clickedUser}  />}
      {selectedUser && <ChatWindow user={user} />}
    </div>
  )
}

export default ChatContainer
