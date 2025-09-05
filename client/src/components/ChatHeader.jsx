import { useChatStore } from '../store/useChatStore'

const ChatHeader = () => {
  const { setSelectedUser } = useChatStore()

  return (
    <div className="padding-border">
      <div className="container">
        <div className="close-icon" onClick={() => setSelectedUser(null)}>
          &#x2715;
        </div>
      </div>
    </div>
  )
}
export default ChatHeader
