import { useState } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { useAuthStore } from '../../store/useAuthStore'
import ConfirmationModal from '../modals/ConfirmationModal'
import toast from 'react-hot-toast'

const ChatHeader = () => {
  const {
    setSelectedUser,
    clearMessages,
    selectedUser,
    unsubscribeFromMessages,
  } = useChatStore()
  const { unmatchUser } = useAuthStore()
  const [confirmModal, setConfirmModal] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

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
      await unmatchUser(selectedUser.user_id)
      toast.success(`Unmatched with ${selectedUser?.userName}`)
      setConfirmModal(null)
      setSelectedUser(null)
    } catch (error) {
      console.error('Unmatch error:', error)
      toast.error('Failed to unmatch. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="padding-border">
        <div className="container">
          <button
            className="unmatch-btn"
            onClick={() =>
              setConfirmModal({
                type: 'unmatch',
                title: 'Unmatch User',
                message: `Are you sure you want to unmatch with ${selectedUser?.userName}? \n\nUnmatching clears your chat history as well. \n\nYou can match again if you both swipe right on each other in the future.`,
              })
            }
          >
            Unmatch
          </button>
          <button
            className="clear-chat-btn"
            onClick={() =>
              setConfirmModal({
                type: 'clearChat',
                title: 'Clear Chat',
                message: (
                  <p>
                    Are you sure you want to clear this chat? This action cannot
                    be undone.
                  </p>
                ),
              })
            }
          >
            Clear Chat
          </button>
          <div className="close-icon" onClick={() => setSelectedUser(null)}>
            &#x2715;
          </div>
        </div>
      </div>

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
    </>
  )
}
export default ChatHeader
