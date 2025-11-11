import { Loader } from 'lucide-react'

const OnboardingSubmitButton = ({ isLoading, isDisabled, isImageUploading }) => {
  return (
    <button type="submit" disabled={isDisabled || isImageUploading}>
      {isImageUploading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <Loader className="spin" size={28} />
          <span>Uploading image please wait to submit form</span>
        </div>
      ) : isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <Loader className="spin" size={28} />
          <span>Submit Profile</span>
        </div>
      ) : (
        'Submit Profile'
      )}
    </button>
  )
}

export default OnboardingSubmitButton
