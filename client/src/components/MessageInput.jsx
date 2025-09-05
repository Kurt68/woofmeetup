import { useRef, useState } from 'react'
import { useChatStore } from '../store/useChatStore'
import { Image, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { Tooltip } from 'react-tooltip'

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
      <div className="tooltip-container">
        Convert heic/heif iPhone/Android images to preview/send!{' '}
        <a
          data-tooltip-id="my-tooltip-multiline"
          data-tooltip-html="To convert native .heic image format imported from your phone
        on a mac open the HEIC file in the Preview app, go to File &gt; Export,
        select JPEG as the format, and save the file for upload. <br /> <br />To convert .heic to JPEG on an iPhone, navigate to the HEIC
        photo you wish to convert and select it. Then, use the ‘Share’ button
        and opt to copy it. The photo auto converts to JPEG. Paste the file to a
        folder on your phone for upload."
        >
          &#9432;
        </a>
        <Tooltip
          id="my-tooltip-multiline"
          opacity={1}
          className="photo-format"
        />
      </div>

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
        </div>
        <button
          type="submit"
          className="text-buttons"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  )
}
export default MessageInput
