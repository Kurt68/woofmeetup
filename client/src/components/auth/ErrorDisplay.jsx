const ErrorDisplay = ({ serverError, authError }) => {
  return (
    <>
      {/* Server error */}
      {typeof serverError === 'string' && (
        <p className="server-error">{serverError}</p>
      )}

      {/* Auth error */}
      {authError && <p className="server-error">{authError}</p>}
    </>
  )
}

export default ErrorDisplay
