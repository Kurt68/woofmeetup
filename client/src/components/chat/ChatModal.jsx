import { useEffect, useRef } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { useAuthStore } from '../../store/useAuthStore'
import MessageInput from './MessageInput'
import { MessageSkeleton } from '../skeletons'
import { formatMessageTime } from '../../utilities/formatTime'
import toast from 'react-hot-toast'

const ChatModal = ({ user }) => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    setSelectedUser,
    clearMessages,
  } = useChatStore()
  const { unmatchUser } = useAuthStore()
  const messageEndRef = useRef(null)

  const handleClose = () => {
    setSelectedUser(null)
  }

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
        `Are you sure you want to unmatch with ${selectedUser?.userName}?\n\nClear the chat first if you want to PERMENTLY delete all of your conversations with them. Than unmatch them.\n\nYou will be able to match again if you swipe right on each other.`
      )
    ) {
      try {
        await unmatchUser(selectedUser.user_id)
        toast.success(`Unmatched with ${selectedUser?.userName}`)
        setSelectedUser(null)
      } catch (error) {
        toast.error('Failed to unmatch. Please try again.')
      }
    }
  }

  useEffect(() => {
    getMessages(selectedUser._id)
    subscribeToMessages()

    return () => unsubscribeFromMessages()
  }, [
    getMessages,
    selectedUser._id,
    subscribeToMessages,
    unsubscribeFromMessages,
  ])

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  if (isMessagesLoading) {
    return (
      <div className="chat-modal-overlay">
        <div className="chat-modal">
          <div className="chat-modal-header">
            <h4>{selectedUser?.userName}</h4>
            <button className="unmatch-btn" onClick={handleUnmatch}>
              Unmatch
            </button>
            <button className="clear-chat-btn" onClick={handleClearChat}>
              Clear Chat
            </button>
            <div className="close-icon" onClick={handleClose}>
              &#x2715;
            </div>
          </div>
          <MessageSkeleton />
          <div className="message-input-container">
            <MessageInput />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal">
        <div className="chat-modal-header">
          <img
            src={selectedUser?.profile_image || '/spinner.svg'}
            alt={selectedUser?.userName}
           className="avatar"
            style={
              !user.profile_image ? { border: 'none' } : {}
            }
          />

          <h4>{selectedUser?.userName}</h4>
          <button className="unmatch-btn" onClick={handleUnmatch}>
            Unmatch
          </button>
          <button className="clear-chat-btn" onClick={handleClearChat}>
            Clear Chat
          </button>
          <div className="close-icon" onClick={handleClose}>
            &#x2715;
          </div>
        </div>
        <div className="chat-scroll padding">
          {messages.map((message) => (
            <div
              key={message._id}
              className={`chat ${
                message.senderId === user._id ? 'chat-end' : 'chat-start'
              }`}
              ref={messageEndRef}
            >
              <div className="chat-image">
                <div className="border-radius">
                  <img
                    className="avatar"
                    src={
                      message.senderId === user._id
                        ? user.imageUrl || '/spinner.svg'
                        : selectedUser.imageUrl || '/spinner.svg'
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header">
                <time className="time">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div className="chat-bubble column-chat-bubble">
                {message.image && <img src={message.image} alt="Attachment" />}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          ))}
        </div>
        <div className="message-input-container">
          <MessageInput />
        </div>
      </div>
    </div>
  )
}

export default ChatModal
