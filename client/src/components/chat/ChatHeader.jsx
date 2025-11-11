import { useChatStore } from '../../store/useChatStore'
import { useAuthStore } from '../../store/useAuthStore'
import toast from 'react-hot-toast'

const ChatHeader = () => {
  const {
    setSelectedUser,
    clearMessages,
    selectedUser,
    unsubscribeFromMessages,
  } = useChatStore()
  const { unmatchUser } = useAuthStore()

  const handleClearChat = () => {
    if (
      window.confirm(
        'Are you sure you want to clear this chat? This action cannot be undone.'
      )
    ) {
      clearMessages()
    }
  }

  const handleUnmatch = async () => {
    if (
      window.confirm(
        `Are you sure you want to unmatch with ${selectedUser?.userName}?\nClear the chat first if you want to PERMANENTLY delete your conversations with the current user. Then unmatch.\n\n You will be able to match again if you swipe right on each other.`
      )
    ) {
      try {
        // Unsubscribe from messages first to prevent socket event handlers from firing
        unsubscribeFromMessages()
        await unmatchUser(selectedUser.user_id)
        toast.success(`Unmatched with ${selectedUser?.userName}`)
        setSelectedUser(null)
      } catch (error) {
        console.error('Unmatch error:', error)
        toast.error('Failed to unmatch. Please try again.')
      }
    }
  }

  return (
    <div className="padding-border">
      <div className="container">
        <button className="unmatch-btn" onClick={handleUnmatch}>
          Unmatch
        </button>
        <button className="clear-chat-btn" onClick={handleClearChat}>
          Clear Chat
        </button>
        <div className="close-icon" onClick={() => setSelectedUser(null)}>
          &#x2715;
        </div>
      </div>
    </div>
  )
}
export default ChatHeader
