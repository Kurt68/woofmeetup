import { Nav } from '../components/layout'
import { OnboardingHeader, OnboardingForm } from '../components/onboarding'
import { PageHead } from '../components/PageHead'
import { useOnboarding } from '../hooks/onboarding'

const Onboarding = () => {
  const {
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
  } = useOnboarding()

  console.log('✅ Onboarding component rendering', {
    formData,
    isProfileImageUploading,
    hasNav: !!Nav,
    hasOnboardingHeader: !!OnboardingHeader,
    hasOnboardingForm: !!OnboardingForm,
  })

  return (
    <>
      <PageHead
        title="Onboarding"
        description="Complete your profile and tell us about your dog to get started on Woof Meetup."
      />
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
