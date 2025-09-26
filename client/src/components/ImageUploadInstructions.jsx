import { memo } from 'react'

const ImageUploadInstructions = memo(() => (
  <div>
    <ul className="instructions">
      <li>&#10003; AI checks an image to match breed.</li>
      <li>&#10003; Mixed breed it guesses.</li>
      <li> &#10003; Head shot & nothing in its mouth.</li>
    </ul>
  </div>
))

ImageUploadInstructions.displayName = 'ImageUploadInstructions'

export default ImageUploadInstructions
