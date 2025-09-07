const UploadInstructions = () => {
  return (
    <div className="instructions">
      <p>
        &#10003; AI checks an image to match a breed. Mixed breed it guesses but
        knows it&apos;s a dog.
      </p>

      <p>&#10003; Head shot & nothing in its mouth works best.</p>

      <p>&#10003; Portrait pics work best too!</p>

      <p>
        &#10003; To convert native .heic image format imported from your phone
        on a mac open the HEIC file in the Preview app, go to File &gt; Export,
        select JPEG as the format, and save the file for upload.
      </p>

      <p>
        &#10003; To convert .heic to JPEG on an iPhone, navigate to the HEIC
        photo you wish to convert and select it. Then, use the 'Share' button
        and opt to copy it. The photo auto converts to JPEG. Paste the file to a
        folder on your phone for upload.
      </p>
    </div>
  )
}

export default UploadInstructions
