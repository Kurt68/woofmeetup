import { Nav } from '../components/layout'
import ImageUpload from './ImageUpload'
import { OnboardingHeader, OnboardingForm } from '../components/onboarding'
import { useOnboarding } from '../hooks/onboarding'

const Onboarding = () => {
  const {
    showSecondButton,
    hideImageUpload,
    profileImageUploaded,
    imageSelected,
    isLoading,
    error,
    aboutError,
    formData,
    isSubmitDisabled,
    setShowSecondButton,
    setHideImageUpload,
    setProfileImageUploaded,
    setImageSelected,
    handleChange,
    submitProfile,
  } = useOnboarding()

  return (
    <>
      <div className="background-color">
        <div className="onboarding overlay-onboarding">
          <Nav minimal={true} setShowModal={() => {}} showModal={false} />
          <div className="auth-modal onboarding">
            <OnboardingHeader />

            {!hideImageUpload && (
              <ImageUpload
                setShowSecondButton={setShowSecondButton}
                setHideImageUpload={setHideImageUpload}
              />
            )}

            {showSecondButton && (
              <OnboardingForm
                formData={formData}
                handleChange={handleChange}
                submitProfile={submitProfile}
                aboutError={aboutError}
                error={error}
                isLoading={isLoading}
                isSubmitDisabled={isSubmitDisabled}
                setProfileImageUploaded={setProfileImageUploaded}
                setImageSelected={setImageSelected}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Onboarding
