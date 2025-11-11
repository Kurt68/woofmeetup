import { useState, useEffect, useRef } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { Header } from '../layout'
import ChatModal from './ChatModal'
import MatchesDisplay from './MatchesDisplay'

const ChatContainer = ({ user }) => {
  const { selectedUser, setSelectedUser } = useChatStore()
  const [animatedMatchIds, setAnimatedMatchIds] = useState(new Set())
  const prevMatchesRef = useRef([])

  // Detect newly added matches and add their user_ids to animatedMatchIds
  useEffect(() => {
    if (!user.matches) return

    const currentMatchIds = user.matches.map((m) => m.user_id)
    const prevMatchIds = prevMatchesRef.current.map((m) => m.user_id)

    // Find newly added matches (in current but not in previous)
    const newMatchIds = currentMatchIds.filter(
      (id) => !prevMatchIds.includes(id)
    )

    if (newMatchIds.length > 0) {
      setAnimatedMatchIds((prev) => {
        const updated = new Set(prev)
        newMatchIds.forEach((id) => updated.add(id))
        return updated
      })
    }

    prevMatchesRef.current = user.matches
  }, [user.matches])

  // Remove animation for selectedUser when ChatModal opens
  useEffect(() => {
    if (selectedUser) {
      setAnimatedMatchIds((prev) => {
        const updated = new Set(prev)
        updated.delete(selectedUser.user_id)
        return updated
      })
    }
  }, [selectedUser])

  return (
    <div className="header-chat-container">
      <Header user={user} />

      {!selectedUser && (
        <MatchesDisplay
          matches={user.matches}
          setSelectedUser={setSelectedUser}
          animatedMatchIds={animatedMatchIds}
        />
      )}

      {selectedUser && <ChatModal user={user} />}
    </div>
  )
}

export default ChatContainer
