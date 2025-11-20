import { useEffect, useRef } from 'react'
import { useChatStore } from '../../store/useChatStore'
import ChatHeader from './ChatHeader'
import MessageInput from './MessageInput'
import { MessageSkeleton } from '../skeletons'
import { formatMessageTime } from '../../utilities/formatTime'
import { sanitizeImageUrl } from '../../utilities/sanitizeUrl'

const ChatWindow = ({ user }) => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore()

  const messageEndRef = useRef(null)

  useEffect(() => {
    const fetchAndSubscribe = async () => {
      await getMessages(selectedUser._id)
      subscribeToMessages()
    }

    fetchAndSubscribe()

    return () => unsubscribeFromMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser._id])

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  if (isMessagesLoading) {
    return (
      <div>
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    )
  }

  return (
    <>
      <ChatHeader />
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
                  src={sanitizeImageUrl(
                    message.senderId === user._id
                      ? user.imageUrl
                      : selectedUser.imageUrl,
                    '/spinner.svg'
                  )}
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
              {message.image && (
                <img
                  src={sanitizeImageUrl(message.image, '/spinner.svg')}
                  alt="Attachment"
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
      </div>
      <MessageInput />
    </>
  )
}

export default ChatWindow
