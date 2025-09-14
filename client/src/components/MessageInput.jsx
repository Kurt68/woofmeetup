import { useRef, useState } from 'react'
import { useChatStore } from '../store/useChatStore'
import { Image, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const MessageInput = () => {
  const [text, setText] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)
  const { sendMessage } = useChatStore()

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!text.trim() && !imagePreview) return

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      })

      // Clear form
      setText('')
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return (
    <div className="container-input">
      {imagePreview && (
        <div className="column-input">
          <div className="input-relative">
            <img src={imagePreview} alt="Preview" className="border-input" />
            <div
              onClick={removeImage}
              className="input-absolute close-icon"
              type="button"
            >
              &#x2715;
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="container-form">
        <div className="row">
          <input
            type="text"
            className="border-form"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="uploadInput"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className="text-buttons"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image />
          </button>
          <button
            type="submit"
            className="text-buttons"
            disabled={!text.trim() && !imagePreview}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  )
}
export default MessageInput
