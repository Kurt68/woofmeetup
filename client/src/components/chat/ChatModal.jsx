import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { useAuthStore } from '../../store/useAuthStore'
import MessageInput from './MessageInput'
import { MessageSkeleton } from '../skeletons'
import ConfirmationModal from '../modals/ConfirmationModal'
import { formatMessageTime } from '../../utilities/formatTime'
import toast from 'react-hot-toast'
import { sanitizeImageUrl } from '../../utilities/sanitizeUrl'

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
  const { unmatchUser, onlineUsers } = useAuthStore()
  const messageEndRef = useRef(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    setSelectedUser(null)
  }

  const handleClearChatConfirm = async () => {
    setIsLoading(true)
    try {
      await clearMessages()
      setConfirmModal(null)
      toast.success('Chat cleared')
    } catch (error) {
      console.error('Clear chat error:', error)
      toast.error('Failed to clear chat. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnmatchConfirm = async () => {
    setIsLoading(true)
    try {
      unsubscribeFromMessages()
      await clearMessages()
      await unmatchUser(selectedUser.user_id)
      toast.success(`Successfully unmatched with ${selectedUser?.userName}`)
      setConfirmModal(null)
      setSelectedUser(null)
    } catch (error) {
      console.error('Unmatch error:', error)
      toast.error('Failed to unmatch. Please try again.')
    } finally {
      setIsLoading(false)
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

  const scrollToBottom = () => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollTop = messageEndRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleImageLoad = () => {
    // Scroll again after image loads to ensure full visibility
    scrollToBottom()
  }

  if (isMessagesLoading) {
    return (
      <div
        className="chat-modal-overlay"
        role="presentation"
        aria-hidden="true"
      >
        <section
          className="chat-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-modal-heading"
        >
          <header className="chat-modal-header">
            <h4 id="chat-modal-heading">{selectedUser?.userName}</h4>
            <button
              className="unmatch-btn"
              onClick={() =>
                setConfirmModal({
                  type: 'unmatch',
                  title: 'Unmatch User',
                  message: `Are you sure you want to unmatch with ${selectedUser?.userName}? \n\nUnmatching clears your chat history as well. \n\nYou can match again if you both swipe right on each other in the future.`,
                })
              }
              aria-label="Unmatch with this user"
              type="button"
            >
              Unmatch
            </button>
            <button
              className="clear-chat-btn"
              onClick={() =>
                setConfirmModal({
                  type: 'clearChat',
                  title: 'Clear Chat',
                  message:
                    'Are you sure you want to clear this chat? This action cannot be undone.',
                })
              }
              aria-label="Clear chat history"
              type="button"
            >
              Clear Chat
            </button>
            <button
              className="close-icon"
              onClick={handleClose}
              aria-label="Close chat"
              type="button"
            >
              &#x2715;
            </button>
          </header>
          <MessageSkeleton />
          <div className="message-input-container">
            <MessageInput />
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="chat-modal-overlay" role="presentation" aria-hidden="true">
      <section
        className="chat-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-modal-heading"
      >
        <header className="chat-modal-header">
          <button
            className="close-icon"
            onClick={handleClose}
            aria-label="Close chat"
            type="button"
          >
            &#x2715;
          </button>
          <div className="header-user-info">
            <img
              src={sanitizeImageUrl(
                selectedUser?.profileImageUrl,
                '/spinner.svg'
              )}
              alt={`${selectedUser?.userName} profile picture`}
              className="avatar"
              loading="lazy"
              decoding="async"
              style={
                !selectedUser?.profileImageUrl ? { background: 'white' } : {}
              }
            />
            <h4 id="chat-modal-heading">
              {selectedUser?.userName}{' '}
              {onlineUsers.includes(selectedUser?.user_id)
                ? 'Online'
                : 'Offline'}
            </h4>

            {onlineUsers.includes(selectedUser?.user_id) && (
              <div className="online-users" aria-hidden="true">
                <span className="blink"></span>
              </div>
            )}
          </div>
          <div className="header-actions">
            <button
              className="unmatch-btn"
              onClick={() =>
                setConfirmModal({
                  type: 'unmatch',
                  title: 'Unmatch User',
                  message: `Are you sure you want to unmatch with ${selectedUser?.userName}? \n\nUnmatching clears your chat history as well. \n\nYou can match again if you both swipe right on each other in the future.`,
                })
              }
              aria-label="Unmatch with this user"
              type="button"
            >
              Unmatch
            </button>
            <button
              className="clear-chat-btn"
              onClick={() =>
                setConfirmModal({
                  type: 'clearChat',
                  title: 'Clear Chat',
                  message:
                    'Are you sure you want to clear this chat? This action cannot be undone.',
                })
              }
              aria-label="Clear chat history"
              type="button"
            >
              Clear Chat
            </button>
          </div>
        </header>
        <div
          className="chat-scroll padding"
          role="log"
          aria-live="polite"
          aria-label="Message history"
          ref={messageEndRef}
        >
          {messages.map((message) => (
            <article
              key={message._id}
              className={`chat ${
                message.senderId === user._id ? 'chat-end' : 'chat-start'
              }`}
            >
              <div className="chat-image">
                <div className="border-radius">
                  <img
                    className="avatar"
                    src={sanitizeImageUrl(
                      message.senderId === user._id
                        ? user.imageUrl
                        : selectedUser.imageUrl,
                      '/spinner.svg'
                    )}
                    alt={`${
                      message.senderId === user._id
                        ? 'Your'
                        : selectedUser?.userName
                    }'s profile picture`}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
              <div className="chat-header">
                <time className="time" dateTime={message.createdAt}>
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div className="chat-bubble column-chat-bubble">
                {message.image && (
                  <img
                    src={sanitizeImageUrl(message.image, '/spinner.svg')}
                    alt="Message attachment"
                    loading="lazy"
                    decoding="async"
                    onLoad={handleImageLoad}
                  />
                )}
                {message.text && <p>{message.text}</p>}
              </div>
            </article>
          ))}
        </div>
        <div className="message-input-container">
          <MessageInput />
        </div>
      </section>

      {confirmModal && (
        <ConfirmationModal
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={
            confirmModal.type === 'clearChat'
              ? handleClearChatConfirm
              : handleUnmatchConfirm
          }
          onCancel={() => setConfirmModal(null)}
          confirmText={confirmModal.type === 'clearChat' ? 'Clear' : 'Unmatch'}
          cancelText="Cancel"
          isLoading={isLoading}
        />
      )}
    </div>
  )
}

export default ChatModal
