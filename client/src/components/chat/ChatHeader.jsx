import { useChatStore } from '../../store/useChatStore'

const ChatHeader = () => {
  const { setSelectedUser, clearMessages } = useChatStore()

  const handleClearChat = () => {
    if (
      window.confirm(
        'Are you sure you want to clear this chat? This action cannot be undone.'
      )
    ) {
      clearMessages()
    }
  }

  return (
    <div className="padding-border">
      <div className="container">
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
