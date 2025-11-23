import { Share2, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useGA } from '../../hooks/useGA'

const SocialShareButtons = ({ profile }) => {
  const [copied, setCopied] = useState(false)
  const { trackShareEvent, trackLinkCopyEvent } = useGA()

  const getCurrentBaseUrl = () => {
    if (import.meta.env.MODE === 'development') {
      return 'http://localhost:5173'
    }
    return 'https://www.woofmeetup.com'
  }

  const getArticle = (word) => {
    if (word.toLowerCase().endsWith('s')) {
      return ''
    }
    const vowels = 'aeiou'
    return vowels.includes(word.toLowerCase()[0]) ? 'an ' : 'a '
  }

  const appUrl = getCurrentBaseUrl()
  const shareUrl = `${appUrl}?referral=${profile.user_id || profile._id}`
  const shareMessage = `Check out ${profile.dogs_name}! A ${
    profile.age
  } year old dog who is looking for ${getArticle(profile.meetup_type)}${
    profile.meetup_type
  } on Woof Meetup.`

  // who likes to "${profile.about}"

  const handleShare = (platform) => {
    let url = ''

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          shareUrl
        )}&text=${encodeURIComponent(shareMessage)}`
        break
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`
        break
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          shareUrl
        )}`
        break
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(
          shareMessage + ' ' + shareUrl
        )}`
        break
      default:
        return
    }

    if (url) {
      trackShareEvent(platform)
      window.open(url, '_blank', 'width=600,height=400')
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Link copied to clipboard!')
    trackLinkCopyEvent()
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="social-share-buttons">
      <button
        className="share-button twitter"
        onClick={() => handleShare('twitter')}
        aria-label="Share on Twitter"
        title="Share on Twitter"
        type="button"
      >
        𝕏
      </button>
      <button
        className="share-button facebook"
        onClick={() => handleShare('facebook')}
        aria-label="Share on Facebook"
        title="Share on Facebook"
        type="button"
      >
        f
      </button>
      <button
        className="share-button linkedin"
        onClick={() => handleShare('linkedin')}
        aria-label="Share on LinkedIn"
        title="Share on LinkedIn"
        type="button"
      >
        in
      </button>
      <button
        className="share-button whatsapp"
        onClick={() => handleShare('whatsapp')}
        aria-label="Share on WhatsApp"
        title="Share on WhatsApp"
        type="button"
      >
        <Share2 size={16} />
      </button>
      <button
        className="share-button copy"
        onClick={handleCopyLink}
        aria-label="Copy link"
        title="Copy link to clipboard"
        type="button"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  )
}

export default SocialShareButtons
