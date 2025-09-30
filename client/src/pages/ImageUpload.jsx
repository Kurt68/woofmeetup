import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '../components/ui'
import {
  ModelStatusIndicator,
  FileUploadInput,
  ImageAnalysisButton,
  ImagePreview,
  AnalysisResults,
  SubmitForm,
} from '../components/upload'
import { useModelLoader, useImageUpload } from '../hooks/upload'

// Lazy load components to reduce initial bundle size
const MascotSVG = lazy(() => import('../components/ui/MascotSVG'))
const ErrorBoundary = lazy(() => import('../components/ui/ErrorBoundary'))

const ImageUpload = ({ setShowSecondButton, setHideImageUpload }) => {
  // Model management hook
  const { isModelLoading, model, dogBreeds, handlePreload, requestModelLoad } =
    useModelLoader()

  // Image upload hook
  const {
    imageURL,
    submitPicture,
    hideText,
    dogFound,
    imageRef,
    fileInputRef,
    submit,
    fileSelected,
    identify,
    triggerUpload,
  } = useImageUpload({
    setShowSecondButton,
    setHideImageUpload,
    model,
    dogBreeds,
  })

  const handleUploadClick = () => {
    triggerUpload()
    requestModelLoad()
  }

  return (
    <Suspense
      fallback={
        <div className="error-boundary-loading">
          <LoadingSpinner />
        </div>
      }
    >
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="mascot-loading">
              <LoadingSpinner />
            </div>
          }
        >
          <MascotSVG />
        </Suspense>

        <div className="image-identification">
          <ModelStatusIndicator isModelLoading={isModelLoading} model={model} />

          <FileUploadInput
            fileInputRef={fileInputRef}
            onFileSelected={fileSelected}
            hideText={hideText}
            onUploadClick={handleUploadClick}
            onPreload={handlePreload}
            showUploadButton={!dogFound?.length}
          />

          <AnalysisResults dogFound={dogFound} />

          <ImageAnalysisButton
            onAnalyze={identify}
            model={model}
            isModelLoading={isModelLoading}
            imageURL={imageURL}
          />

          <SubmitForm
            onSubmit={submit}
            showSubmit={submitPicture && dogFound.length > 0}
          />

          <ImagePreview imageURL={imageURL} imageRef={imageRef} />
        </div>
      </ErrorBoundary>
    </Suspense>
  )
}
export default ImageUpload
