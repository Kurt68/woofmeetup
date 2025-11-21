const HomeShareButtons = () => {
  const appUrl = 'https://woofmeetup.com'
  const shareMessage =
    'Join Woof Meetup - Connect with dog owners and arrange meetups for your furry friends! 🐕'

  const handleShare = (platform) => {
    let url = ''

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          appUrl
        )}&text=${encodeURIComponent(shareMessage)}`
        break
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          appUrl
        )}`
        break
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          appUrl
        )}`
        break
      default:
        return
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400')
    }
  }

  return (
    <div className="home-share-section">
      <p className="home-share-text">Share Woof Meetup:</p>
      <div className="home-share-buttons">
        <button
          className="home-share-button twitter"
          onClick={() => handleShare('twitter')}
          aria-label="Share on Twitter"
          title="Share on Twitter"
          type="button"
        >
          𝕏
        </button>
        <button
          className="home-share-button facebook"
          onClick={() => handleShare('facebook')}
          aria-label="Share on Facebook"
          title="Share on Facebook"
          type="button"
        >
          f
        </button>
        <button
          className="home-share-button linkedin"
          onClick={() => handleShare('linkedin')}
          aria-label="Share on LinkedIn"
          title="Share on LinkedIn"
          type="button"
        >
          in
        </button>
      </div>
    </div>
  )
}

export default HomeShareButtons
