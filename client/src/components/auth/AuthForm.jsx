import { Link } from 'react-router-dom'
import FormField from './FormField'
import PasswordConfirmField from './PasswordConfirmField'
import SubmitButton from './SubmitButton'
import ErrorDisplay from './ErrorDisplay'

const AuthForm = ({
  isSignUp,
  email,
  setEmail,
  password,
  handlePasswordChange,
  userName,
  setUserName,
  confirmPassword,
  handleConfirmPasswordChange,
  passwordMatchError,
  emailErrors,
  passwordErrors,
  serverError,
  authError,
  isLoading,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="form">
      <FormField
        label="Your First Name"
        type="text"
        id="name"
        placeholder="First Name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        errors={[]}
      />

      <FormField
        label="Email"
        type="email"
        id="email"
        name="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        errors={emailErrors}
      />

      <div style={{ marginTop: '1rem' }}>
        <FormField
          label="Password"
          type="password"
          id="password"
          name="password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange}
          errors={passwordErrors}
        />
      </div>

      {!isSignUp && (
        <Link to="/forgot-password" className="forgot-password">
          Forgot Password
        </Link>
      )}

      {isSignUp && (
        <PasswordConfirmField
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          passwordMatchError={passwordMatchError}
        />
      )}

      <SubmitButton isLoading={isLoading} />

      <ErrorDisplay serverError={serverError} authError={authError} />
    </form>
  )
}

export default AuthForm
