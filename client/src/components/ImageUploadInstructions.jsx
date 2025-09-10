import { memo } from 'react'

const ImageUploadInstructions = memo(() => (
  <div className="instructions">
    <p>
      &#10003; AI checks an image to match a breed. Mixed breed it guesses but
      knows it&apos;s a dog.
    </p>

    <p>&#10003; Head shot & nothing in its mouth works best.</p>

    <p>&#10003; Portrait pics work best too!</p>
  </div>
))

ImageUploadInstructions.displayName = 'ImageUploadInstructions'

export default ImageUploadInstructions
