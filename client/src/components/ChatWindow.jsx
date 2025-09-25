import { useEffect, useRef } from 'react'
import { useChatStore } from '../store/useChatStore'
import ChatHeader from './ChatHeader'
import MessageInput from './MessageInput'
import MessageSkeleton from './skeletons/MessageSkeleton'
import { formatMessageTime } from '../utilities/formatTime'

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
                  src={
                    message.senderId === user._id
                      ? user.imageUrl || '/avatar.png'
                      : selectedUser.imageUrl || '/avatar.png'
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
      <MessageInput />
    </>
  )
}

export default ChatWindow
