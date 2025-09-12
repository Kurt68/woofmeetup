import { memo } from 'react'

const ImageUploadInstructions = memo(() => (
  <div>
    <ul className="instructions">
      <li>&#10003; AI checks an image to match a breed.</li>
      <li>&#10003; Mixed breed it guesses but knows it&apos;s a dog.</li>
      <li> &#10003; Head shot & nothing in its mouth works best.</li>
      &#10003; Portrait pics work best too!
    </ul>
  </div>
))

ImageUploadInstructions.displayName = 'ImageUploadInstructions'

export default ImageUploadInstructions
