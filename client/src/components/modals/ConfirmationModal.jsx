const ConfirmationModal = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
}) => {
  return (
    <div
      className="auth-modal confirmation-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
    >
      <button
        className="close-icon"
        onClick={onCancel}
        aria-label="Close modal"
        type="button"
      >
        &#x2715;
      </button>
      <h2 id="confirmation-title">{title}</h2>
      <div className="confirmation-modal-message">{message}</div>

      <div className="confirmation-modal-actions">
        <button
          className="primary-button"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : confirmText}
        </button>
        <button
          className="secondary-button"
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelText}
        </button>
      </div>
    </div>
  )
}

export default ConfirmationModal
