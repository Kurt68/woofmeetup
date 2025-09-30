import DogProfileForm from './DogProfileForm'
import MeetupPreferences from './MeetupPreferences'
import ProfileImageSection from './ProfileImageSection'
import OnboardingSubmitButton from './OnboardingSubmitButton'

const OnboardingForm = ({
  formData,
  handleChange,
  submitProfile,
  aboutError,
  error,
  isLoading,
  isSubmitDisabled,
  setProfileImageUploaded,
  setImageSelected,
}) => {
  return (
    <form onSubmit={submitProfile}>
      <section>
        <DogProfileForm
          formData={formData}
          handleChange={handleChange}
          aboutError={aboutError}
        />

        <MeetupPreferences formData={formData} handleChange={handleChange} />

        {/* Hidden field for search radius */}
        <input
          type="hidden"
          required={true}
          value={formData.current_user_search_radius}
          onChange={handleChange}
        />

        <ProfileImageSection
          setImageUploaded={setProfileImageUploaded}
          setImageSelected={setImageSelected}
        />

        <br />

        <OnboardingSubmitButton
          isLoading={isLoading}
          isDisabled={isSubmitDisabled}
        />

        {error && <p className="server-error">{error}</p>}
      </section>
    </form>
  )
}

export default OnboardingForm
