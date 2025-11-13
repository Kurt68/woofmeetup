import { useRef, useState } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { Image, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { compressImage } from '../../utilities/compressImage'

const MessageInput = () => {
  const [text, setText] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const [isSendingImage, setIsSendingImage] = useState(false)
  const fileInputRef = useRef(null)
  const { sendMessage } = useChatStore()

  const handleImageChange = async (e) => {
    const file = e.target.files[0]

    if (!file) return

    const ALLOWED_TYPES = [
      'image/png',
      'image/gif',
      'image/svg+xml',
      'image/jpeg',
      'image/jpg',
    ]
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only PNG, GIF, SVG, and JPG images are supported')
      return
    }

    const MAX_FILE_SIZE_MB = 15
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`Image too large. Max size: ${MAX_FILE_SIZE_MB}MB`)
      return
    }

    try {
      toast.loading('Compressing image...', { id: 'compress' })

      let imageToPreview = file

      if (file.type !== 'image/gif' && file.type !== 'image/svg+xml') {
        imageToPreview = await compressImage(file, 0.6)
      }

      setImagePreview(imageToPreview)
      toast.dismiss('compress')
      toast.success('Image ready to send')
    } catch (error) {
      toast.dismiss('compress')
      toast.error('Failed to process image')
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!text.trim() && !imagePreview) return

    const sendingImage = Boolean(imagePreview)
    if (sendingImage) setIsSendingImage(true)

    try {
      await sendMessage({
        text: text.trim(),
        imageBlob: imagePreview,
      })

      // Clear form
      setText('')
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally {
      if (sendingImage) setIsSendingImage(false)
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

          {isSendingImage && (
            <div
              className="sending-indicator"
              aria-live="polite"
              aria-label="Sending image"
            >
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSendMessage} className="container-form">
        <div className="row">
          <input
            type="text"
            className="border-form"
            placeholder="Message/upload image..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept=".png,.gif,.svg,.jpg,.jpeg,image/png,image/gif,image/svg+xml,image/jpeg"
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
