import { Loader } from 'lucide-react'

const SubmitButton = ({ isLoading, disabled }) => {
  return (
    <button
      className="secondary-button"
      style={{ height: '3.4rem' }}
      type="submit"
      disabled={isLoading || disabled}
    >
      {isLoading ? <Loader className="spin" size={28} /> : 'Submit'}
    </button>
  )
}

export default SubmitButton
