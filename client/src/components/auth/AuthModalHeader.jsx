const AuthModalHeader = ({ isSignUp, onClose }) => {
  return (
    <>
      <button
        className="close-icon"
        onClick={onClose}
        aria-label="Close modal"
        type="button"
      >
        &#x2715;
      </button>
      <h2 id="auth-modal-heading">
        {isSignUp ? 'Create Account' : 'Welcome Back'}
      </h2>
    </>
  )
}

export default AuthModalHeader
