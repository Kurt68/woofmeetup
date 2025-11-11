import { Loader } from 'lucide-react'

const SubmitButton = ({ isLoading, disabled }) => {
  return (
    <button
      className="secondary-button"
      style={{ height: '3.4rem' }}
      type="submit"
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <Loader className="spin" size={28} />
          <span>Submit</span>
        </div>
      ) : (
        'Submit'
      )}
    </button>
  )
}

export default SubmitButton
