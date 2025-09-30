const AuthModalHeader = ({ isSignUp, onClose }) => {
  return (
    <>
      <div className="close-icon" onClick={onClose}>
        &#x2715;
      </div>
      <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
    </>
  )
}

export default AuthModalHeader
