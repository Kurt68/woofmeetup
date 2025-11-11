import { Nav } from '../components/layout'
import { OnboardingHeader, OnboardingForm } from '../components/onboarding'
import { useOnboarding } from '../hooks/onboarding'
import { useState, useEffect } from 'react'

const Onboarding = () => {
  const [renderError, setRenderError] = useState(null)

  let hookData
  try {
    hookData = useOnboarding()
  } catch (err) {
    console.error('❌ Error in useOnboarding hook:', err)
    setRenderError(`Hook Error: ${err.message}`)
  }

  if (renderError) {
    return (
      <div
        style={{
          padding: '20px',
          color: 'red',
          backgroundColor: '#fff',
          border: '2px solid red',
        }}
      >
        <h3>Onboarding Error</h3>
        <p>{renderError}</p>
      </div>
    )
  }

  const {
    profileImageUploaded,
    imageSelected,
    isLoading,
    error,
    aboutError,
    userAboutError,
    formData,
    isSubmitDisabled,
    setProfileImageUploaded,
    setImageSelected,
    handleChange,
    submitProfile,
    dogImageURL,
    isDogImageUploading,
    isProfileImageUploading,
    dogImageError,
    handleDogImageSelect,
    handleDogImageUpload,
    clearDogImage,
    dogBreeds,
    setIsProfileImageUploading,
  } = hookData

  console.log('✅ Onboarding component rendering', {
    formData,
    isProfileImageUploading,
    hasNav: !!Nav,
    hasOnboardingHeader: !!OnboardingHeader,
    hasOnboardingForm: !!OnboardingForm,
  })

  return (
    <>
      <div className="background-color">
        <div className="onboarding overlay-onboarding" aria-hidden="true">
          <Nav minimal={true} setShowModal={() => {}} showModal={false} />
          <div
            className="auth-modal onboarding"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-heading"
          >
            <OnboardingHeader />

            <OnboardingForm
              formData={formData}
              handleChange={handleChange}
              submitProfile={submitProfile}
              aboutError={aboutError}
              userAboutError={userAboutError}
              error={error}
              isLoading={isLoading}
              isSubmitDisabled={isSubmitDisabled}
              setProfileImageUploaded={setProfileImageUploaded}
              setImageSelected={setImageSelected}
              setIsProfileImageUploading={setIsProfileImageUploading}
              dogImageURL={dogImageURL}
              isDogImageUploading={isDogImageUploading}
              isProfileImageUploading={isProfileImageUploading}
              dogImageError={dogImageError}
              onDogImageSelect={handleDogImageSelect}
              onDogImageUpload={handleDogImageUpload}
              onClearDogImage={clearDogImage}
              dogBreeds={dogBreeds}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default Onboarding
