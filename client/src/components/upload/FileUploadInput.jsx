import { Suspense } from 'react'
import ImageUploadInstructions from './ImageUploadInstructions'

const FileUploadInput = ({
  fileInputRef,
  onFileSelected,
  hideText,
  onUploadClick,
  onPreload,
  showUploadButton,
}) => {
  return (
    <>
      <input
        id="dogs-picture"
        onChange={onFileSelected}
        type="file"
        accept="image/*"
        className="uploadInput"
        ref={fileInputRef}
      />

      <section>
        {!hideText && (
          <label htmlFor="dogs-picture">
            <Suspense fallback={<div>Loading instructions...</div>}>
              <ImageUploadInstructions />
            </Suspense>
          </label>
        )}

        {showUploadButton && (
          <button
            className="uploadImage"
            onClick={onUploadClick}
            onMouseEnter={onPreload}
            onFocus={onPreload}
          >
            Upload Image
          </button>
        )}
      </section>
    </>
  )
}

export default FileUploadInput
