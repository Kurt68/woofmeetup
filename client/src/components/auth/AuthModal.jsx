import AuthModalHeader from './AuthModalHeader'
import AuthModalDisclaimer from './AuthModalDisclaimer'
import TurnstileSection from './TurnstileSection'
import AuthForm from './AuthForm'
import { useAuthModal } from '../../hooks/auth'

const AuthModal = ({ setShowModal, isSignUp }) => {
  const {
    // Form state
    email,
    setEmail,
    password,
    userName,
    setUserName,
    confirmPassword,
    passwordMatchError,
    serverError,
    emailErrors,
    passwordErrors,
    isLoading,
    authError,

    // Turnstile state
    showSignUpForm,
    showTurnstile,
    turnstileError,

    // Handlers
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
    <div className="auth-modal">
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
          setEmail={setEmail}
          password={password}
          handlePasswordChange={handlePasswordChange}
          userName={userName}
          setUserName={setUserName}
          confirmPassword={confirmPassword}
          handleConfirmPasswordChange={handleConfirmPasswordChange}
          passwordMatchError={passwordMatchError}
          emailErrors={emailErrors}
          passwordErrors={passwordErrors}
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
