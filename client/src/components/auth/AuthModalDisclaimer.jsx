const AuthModalDisclaimer = ({ isSignUp }) => {
  return (
    <p className="modal-copy">
      By clicking {isSignUp ? 'Create Account' : 'Log In'}, you agree to our
      terms. Learn how we process your data in our Privacy Policy, Terms of
      Service and Cookie Policy.
    </p>
  )
}

export default AuthModalDisclaimer
