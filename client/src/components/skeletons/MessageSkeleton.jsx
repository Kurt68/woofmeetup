const MessageSkeleton = () => {
  const skeletonMessages = Array(6).fill(null)

  return (
    <div className="column padding">
      {skeletonMessages.map((_, idx) => (
        <div
          key={idx}
          className={`loading chat ${
            idx % 2 === 0 ? 'chat-start' : 'chat-end'
          }`}
        >
          <div className="chat-image">
            <div className="border-radius">
              <img className="avatar gray" />
            </div>
          </div>
          <div className="chat-header gray">
            <time className="time">10:15</time>
          </div>
          <div className="chat-bubble gray column-chat-bubble"></div>
        </div>
      ))}
    </div>
  )
}

export default MessageSkeleton
