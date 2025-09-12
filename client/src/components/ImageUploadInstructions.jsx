import { memo } from 'react'

const ImageUploadInstructions = memo(() => (
  <div>
    <ul className="instructions">
      <li>&#10003; AI checks an image to match breed.</li>
      <li>&#10003; Mixed it guesses but knows it&apos;s a dog.</li>
      <li> &#10003; Head shot & nothing in its mouth.</li>
      &#10003; Portrait pics work best too!
    </ul>
  </div>
))

ImageUploadInstructions.displayName = 'ImageUploadInstructions'

export default ImageUploadInstructions
