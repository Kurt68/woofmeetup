import AuthModalHeader from './AuthModalHeader'
import AuthModalDisclaimer from './AuthModalDisclaimer'
import TurnstileSection from './TurnstileSection'
import AuthForm from './AuthForm'
import { useAuthModal } from '../../hooks/auth'

const AuthModal = ({ setShowModal, isSignUp }) => {
  const {
    // Form state
    email,
    password,
    userName,
    confirmPassword,
    passwordMatchError,
    serverError,
    emailErrors,
    passwordErrors,
    userNameErrors,
    isLoading,
    authError,

    // Turnstile state
    showSignUpForm,
    showTurnstile,
    turnstileError,

    // Handlers
    handleEmailChange,
    handleUserNameChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleSubmit,
    handleTurnstileSuccess,
    handleTurnstileError,
  } = useAuthModal(isSignUp)

  const handleClick = () => {
    setShowModal(false)
  }

  return (
    <div
      className="auth-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-heading"
    >
      <AuthModalHeader isSignUp={isSignUp} onClose={handleClick} />

      <AuthModalDisclaimer isSignUp={isSignUp} />

      <TurnstileSection
        showTurnstile={showTurnstile}
        onSuccess={handleTurnstileSuccess}
        onError={handleTurnstileError}
        turnstileError={turnstileError}
      />

      {showSignUpForm && (
        <AuthForm
          isSignUp={isSignUp}
          email={email}
          handleEmailChange={handleEmailChange}
          password={password}
          handlePasswordChange={handlePasswordChange}
          userName={userName}
          handleUserNameChange={handleUserNameChange}
          confirmPassword={confirmPassword}
          handleConfirmPasswordChange={handleConfirmPasswordChange}
          passwordMatchError={passwordMatchError}
          emailErrors={emailErrors}
          passwordErrors={passwordErrors}
          userNameErrors={userNameErrors}
          serverError={serverError}
          authError={authError}
          isLoading={isLoading}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

export default AuthModal
