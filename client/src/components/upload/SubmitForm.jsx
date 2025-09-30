const SubmitForm = ({ onSubmit, showSubmit }) => {
  if (!showSubmit) return null

  return (
    <form className="image-submit" onSubmit={onSubmit}>
      <button className="edit-button" type="submit">
        Submit your dog!
      </button>
    </form>
  )
}

export default SubmitForm
