import { SimpleImageUpload } from '../upload'

const ProfileImageSection = ({ setImageUploaded, setImageSelected }) => {
  return (
    <div className="profile-image-section">
      <SimpleImageUpload
        setImageUploaded={setImageUploaded}
        setImageSelected={setImageSelected}
        currentImageUrl={null}
        showCurrentImage={false}
      />
    </div>
  )
}

export default ProfileImageSection
