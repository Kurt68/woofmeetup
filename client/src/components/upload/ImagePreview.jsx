const ImagePreview = ({ imageURL, imageRef }) => {
  if (!imageURL) return null

  return (
    <div className="imageHolder">
      <img
        src={imageURL}
        alt="Upload Preview"
        crossOrigin="anonymous"
        ref={imageRef}
      />
    </div>
  )
}

export default ImagePreview
