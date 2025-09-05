const CurrentImage = ({ user, deleteImage }) => {
  return (
    <>
      <button className="edit-button" onClick={deleteImage}>
        Delete Image
      </button>
      <br />
      <br />

      <div className="imageHolder">
        <img src={user.imageUrl} alt={'photo of ' + user.dogs_name} />
      </div>
    </>
  )
}

export default CurrentImage
