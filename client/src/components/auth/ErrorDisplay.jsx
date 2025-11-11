import { sanitizeErrorMessage } from '../../utilities/sanitizeUrl'

const ErrorDisplay = ({ serverError, authError }) => {
  return (
    <>
      {/* Server error */}
      {typeof serverError === 'string' && (
        <p className="server-error">{sanitizeErrorMessage(serverError)}</p>
      )}

      {/* Auth error */}
      {authError && (
        <p className="server-error">{sanitizeErrorMessage(authError)}</p>
      )}
    </>
  )
}

export default ErrorDisplay
