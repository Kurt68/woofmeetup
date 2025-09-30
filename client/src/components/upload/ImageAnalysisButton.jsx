const ImageAnalysisButton = ({
  onAnalyze,
  model,
  isModelLoading,
  imageURL,
}) => {
  if (!imageURL) return null

  const isDisabled = !model || isModelLoading

  return (
    <button
      onClick={onAnalyze}
      className="button"
      disabled={isDisabled}
      style={{
        backgroundColor: isDisabled ? '#9ca3af' : '',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      {isModelLoading
        ? 'Loading AI model...'
        : !model
        ? 'AI model not ready'
        : 'Please identify image'}
    </button>
  )
}

export default ImageAnalysisButton
