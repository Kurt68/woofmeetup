import DogProfileForm from './DogProfileForm'
import DogImageUploadSection from './DogImageUploadSection'
import MeetupPreferences from './MeetupPreferences'
import UserProfileSection from './UserProfileSection'
import OnboardingSubmitButton from './OnboardingSubmitButton'
import { SimpleImageUpload } from '../upload'

/**
 * OnboardingForm - Shared form component for user profile creation and editing
 *
 * This component orchestrates all form sections and is used in two contexts:
 * - NEW PROFILES: Onboarding page (/onboarding) - no existing images
 * - EDIT PROFILES: EditDogProfile page (/edit-profile) - with image previews
 *
 * The component composes sub-components in a specific order:
 * 1. Dog image upload (with optional preview of current image)
 * 2. Dog profile form (name, age, about)
 * 3. Meetup preferences (type and interests)
 * 4. User profile image upload (with optional preview)
 * 5. User profile section (age, about)
 * 6. Submit button
 *
 * Image Flow:
 * - NEW: dogImageURL and currentImageUrl are both null until user selects/uploads
 * - EDIT: currentDogImageUrl and currentProfileImageUrl are signed URLs from backend
 * - After selection: imageURL becomes a blob URL until upload completes
 * - After upload: image files are uploaded to backend endpoints
 *
 * @param {Object} props
 * @param {Object} props.formData - Form data object containing all fields
 * @param {Function} props.handleChange - Form change handler (e) => void
 * @param {Function} props.submitProfile - Form submission handler (e) => Promise
 * @param {string} props.aboutError - Dog about field validation error message
 * @param {string} props.userAboutError - User about field validation error message
 * @param {string} props.error - General form error message
 * @param {boolean} props.isLoading - Form submission loading state
 * @param {boolean} props.isSubmitDisabled - Submit button disabled state
 * @param {Function} props.setProfileImageUploaded - Callback when profile image uploads
 * @param {Function} props.setImageSelected - Callback when image is selected
 * @param {Function} props.setIsProfileImageUploading - Callback to track profile image upload progress
 * @param {string|null} props.dogImageURL - Blob URL of selected dog image (new upload)
 * @param {boolean} props.isDogImageUploading - Dog image upload in progress
 * @param {string|null} props.dogImageError - Dog image upload error message
 * @param {Function} props.onDogImageSelect - Callback for dog image file selection
 * @param {Function} props.onDogImageUpload - Callback for uploading dog image
 * @param {Function} props.onClearDogImage - Callback for clearing dog image selection
 * @param {Array} props.dogBreeds - Detected dog breeds from ML model
 * @param {string|null} props.currentDogImageUrl - Existing dog image signed URL (edit mode)
 * @param {string|null} props.currentProfileImageUrl - Existing profile image signed URL (edit mode)
 */
const OnboardingForm = ({
  formData,
  handleChange,
  submitProfile,
  aboutError,
  userAboutError,
  error,
  isLoading,
  isSubmitDisabled,
  setProfileImageUploaded,
  setImageSelected,
  setIsProfileImageUploading,
  dogImageURL,
  isDogImageUploading,
  isProfileImageUploading,
  dogImageError,
  onDogImageSelect,
  onDogImageUpload,
  onClearDogImage,
  dogBreeds = [],
  currentDogImageUrl = null,
  currentProfileImageUrl = null,
}) => {
  return (
    <form onSubmit={submitProfile}>
      <section>
        <DogImageUploadSection
          imageURL={dogImageURL}
          isUploading={isDogImageUploading}
          error={dogImageError}
          onImageSelect={onDogImageSelect}
          onUpload={onDogImageUpload}
          onClear={onClearDogImage}
          dogBreeds={dogBreeds}
          currentImageUrl={currentDogImageUrl}
          showCurrentImage={!!currentDogImageUrl}
        />

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

        <div className="profile-image-section">
          <SimpleImageUpload
            setImageUploaded={setProfileImageUploaded}
            setImageSelected={setImageSelected}
            setIsUploading={setIsProfileImageUploading}
            currentImageUrl={currentProfileImageUrl}
            showCurrentImage={!!currentProfileImageUrl}
          />
        </div>

        <UserProfileSection
          formData={formData}
          handleChange={handleChange}
          userAboutError={userAboutError}
        />

        <br />

        <OnboardingSubmitButton
          isLoading={isLoading}
          isDisabled={isSubmitDisabled}
          isImageUploading={isDogImageUploading || isProfileImageUploading}
        />

        {error && <p className="server-error">{error}</p>}
      </section>
    </form>
  )
}

export default OnboardingForm
