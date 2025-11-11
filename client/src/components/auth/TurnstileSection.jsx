import TurnstileWidget from './TurnstileWidget'

const TurnstileSection = ({
  showTurnstile,
  onSuccess,
  onError,
  turnstileError,
}) => {
  if (!showTurnstile) return null

  return (
    <div>
      <TurnstileWidget
        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
        onSuccess={onSuccess}
        onError={onError}
      />
      {turnstileError && (
        <div className="msg" style={{ color: 'red', marginTop: '10px' }}>
          {turnstileError}
        </div>
      )}
    </div>
  )
}

export default TurnstileSection
