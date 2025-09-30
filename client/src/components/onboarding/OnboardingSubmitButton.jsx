import { Loader } from 'lucide-react'

const OnboardingSubmitButton = ({ isLoading, isDisabled }) => {
  return (
    <button type="submit" disabled={isDisabled}>
      {isLoading ? <Loader className="spin" size={28} /> : 'Submit Profile'}
    </button>
  )
}

export default OnboardingSubmitButton
