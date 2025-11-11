import { Link } from 'react-router-dom'
import FormField from './FormField'
import PasswordConfirmField from './PasswordConfirmField'
import SubmitButton from './SubmitButton'
import ErrorDisplay from './ErrorDisplay'

const AuthForm = ({
  isSignUp,
  email,
  handleEmailChange,
  password,
  handlePasswordChange,
  userName,
  handleUserNameChange,
  confirmPassword,
  handleConfirmPasswordChange,
  passwordMatchError,
  emailErrors,
  passwordErrors,
  userNameErrors,
  serverError,
  authError,
  isLoading,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="form" noValidate>
      <fieldset style={{ border: 'none', padding: '0' }}>
        <legend className="sr-only">
          {isSignUp ? 'Create Account' : 'Login'} Information
        </legend>

        {isSignUp && (
          <FormField
            label="Your First Name"
            type="text"
            id="name"
            placeholder="Your First Name"
            value={userName}
            onChange={handleUserNameChange}
            errors={userNameErrors}
          />
        )}

        <FormField
          label="Email"
          type="email"
          id="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={handleEmailChange}
          errors={emailErrors}
        />

        <div>
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
      </fieldset>

      <ErrorDisplay serverError={serverError} authError={authError} />
    </form>
  )
}

export default AuthForm
