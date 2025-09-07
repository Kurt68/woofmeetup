import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useCookies } from 'react-cookie'
import * as mobilenet from '@tensorflow-models/mobilenet'
import LoadingSpinner from '../components/LoadingSpinner'

const API_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000/api/auth'
    : '/api/auth'

const ImageUpload = ({ setShowSecondButton, setHideImageUpload }) => {
  const [cookies] = useCookies(null)
  const [file, setFile] = useState()

  const [isModelLoading, setIsModelLoading] = useState(false)
  const [model, setModel] = useState(null)
  const [imageURL, setImageURL] = useState(null)
  const [results, setResults] = useState([])
  const [submitPicture, setSubmitPicture] = useState(false)
  const [hideText, setHideText] = useState(false)

  const imageRef = useRef()
  const fileInputRef = useRef()

  const submit = async (event) => {
    event.preventDefault()
    setShowSecondButton(true)
    setHideImageUpload(true)

    const formData = new FormData()
    formData.append('UserId', cookies.UserId)
    formData.append('image', file)

    await axios.put(`${API_URL}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }

  const fileSelected = (e) => {
    // s3 file
    const file = e.target.files[0]
    setFile(file)

    // create client side image url
    const { files } = e.target
    if (files.length > 0) {
      const url = URL.createObjectURL(files[0])
      setImageURL(url)
    } else {
      setImageURL(null)
    }
  }

  const loadModel = async () => {
    setIsModelLoading(true)
    try {
      const model = await mobilenet.load()
      setModel(model)
      setIsModelLoading(false)
    } catch (error) {
      console.log(error)
      setIsModelLoading(false)
    }
  }

  const identify = async () => {
    const results = await model.classify(imageRef.current)
    setResults(results)
    setSubmitPicture(true)
  }
  // match model api to list of all dog breeds
  const dogBreeds = [
    'affenpinscher',
    'afghan hound',
    'airedale terrier',
    'akita',
    'alaskan klee kai',
    'alaskan malamute',
    'american bulldog',
    'american cocker spaniel',
    'american eskimo dog',
    'american hairless terrier',
    'american leopard hound',
    'american pit bull terrier',
    'american staffordshire terrier',
    'american water spaniel',
    'anatolian shepherd dog',
    'aussiedoodle',
    'australian cattle dog',
    'australian kelpie',
    'australian labradoodle',
    'australian shepherd',
    'australian silky terrier',
    'australian terrier',
    'australian working kelpie',
    'azawakh',
    'basenji',
    'bassador',
    'basset bleu de gascogne',
    'basset fauve de bretagne',
    'basset hound',
    'bassugg',
    'bavarian mountain hound',
    'beagador',
    'beagle',
    'beaglier',
    'bearded collie',
    'beauceron',
    'bedlington terrier',
    'bedlington whippet',
    'belgian groenendael',
    'belgian laekenois',
    'belgian malinois',
    'belgian shepherd',
    'belgian tervuren',
    'bergamasco',
    'bernedoodle',
    'bernese mountain dog',
    'bichon frise',
    'bichon yorkie',
    'bich-poo',
    'biewer terrier',
    'black and tan coonhound',
    'black russian terrier',
    'bloodhound',
    'blue lacy',
    'bluetick coonhound',
    'boerboel',
    'bolognese',
    'borador',
    'border collie',
    'border jack',
    'border terrier',
    'bordoodle',
    'borzoi',
    'boston terrier',
    'bouvier des flandres',
    'boxador',
    'boxer',
    'bracco italiano',
    "braque d'auvergne",
    'briard',
    'brittany',
    'bugg',
    'bullmastiff',
    'bull pei',
    'bull terrier',
    'cairn terrier',
    'canaan dog',
    'canadian eskimo dog',
    'cane corso italiano',
    'cardigan welsh corgi',
    'catahoula leopard dog',
    'catalan sheepdog',
    'caucasian shepherd dog',
    'cavachon',
    'cavalier king charles spaniel',
    'cavapom',
    'cavapoo',
    'cavapoochon',
    'cava tzu',
    'cesky terrier',
    'cheagle',
    'chesapeake bay retriever',
    'chihuahua',
    'chinook',
    'chipoo',
    'chi staffy bull',
    'chiweenie',
    'chorkie',
    'chow chow',
    'chow shepherd',
    'chug',
    'chusky',
    "cirneco dell'etna",
    'clumber spaniel',
    'cockachon',
    'cockador',
    'cockapoo',
    'cocker spaniel',
    'cojack',
    'corgi',
    'coton de tulear',
    'curly coated retriever',
    'dachshund',
    'dalmatian',
    'dameranian',
    'dandie dinmont terrier',
    'deerhound',
    'dobermann',
    'dogue de bordeaux',
    'dorkie',
    'doxiepoo',
    'dutch shepherd',
    'english bulldog',
    'english coonhound',
    'english setter',
    'english toy terrier',
    'entlebucher mountain dog',
    'estrela mountain dog',
    'eurasier',
    'field spaniel',
    'finnish lapphund',
    'finnish spitz',
    'flat-coated retriever',
    'foxhound',
    'fox terrier',
    'french bulldog',
    'french bull jack',
    'frenchie staff',
    'french pin',
    'frug',
    'gerberian shepsky',
    'german longhaired pointer',
    'german pinscher',
    'german shepherd',
    'german sheprador',
    'german shorthaired pointer',
    'german spitz',
    'german wirehaired pointer',
    'giant schnauzer',
    'glen of imaal terrier',
    'goberian',
    'goldendoodle',
    'golden dox',
    'golden labrador',
    'golden retriever',
    'golden shepherd',
    'gordon setter',
    'grand basset griffon vendeen',
    'grand bleu de gascogne',
    'great dane',
    'great pyrenees',
    'greater swiss mountain dog',
    'greek harehound',
    'greenland dog',
    'greyhound',
    'griffon bruxellois',
    'griffon fauve de bretagne',
    'hairless chinese crested',
    'hamiltonstovare',
    'harrier',
    'havanese',
    'horgi',
    'hovawart',
    'hungarian kuvasz',
    'hungarian puli',
    'hungarian pumi',
    'hungarian vizsla',
    'ibizan hound',
    'icelandic sheepdog',
    'irish doodle',
    'irish red & white setter',
    'irish setter',
    'irish terrier',
    'irish water spaniel',
    'irish wolfhound',
    'italian greyhound',
    'italian spinone',
    'jack-a-bee',
    'jackahuahua',
    'jack-a-poo',
    'jack russell terrier',
    'jackshund',
    'jacktzu',
    'japanese akita',
    'japanese chin',
    'japanese shiba',
    'japanese spitz',
    'johnson american bulldog',
    'keeshond',
    'kerry blue terrier',
    'king charles spaniel',
    'kokoni',
    'komondor',
    'kooikerhondje',
    'korean jindo',
    'korthals griffon',
    'labradoodle',
    'labrador retriever',
    'lachon',
    'lagotto romagnolo',
    'lakeland terrier',
    'lancashire heeler',
    'large munsterlander',
    'leonberger',
    'lhasa apso',
    'lhasapoo',
    'lhatese',
    'löwchen',
    'lurcher',
    'mal-shi',
    'maltese',
    'maltichon',
    'maltipom',
    'malti-poo',
    'manchester terrier',
    'maremma sheepdog',
    'mastiff',
    'mexican hairless',
    'miniature bull terrier',
    'miniature pinscher',
    'miniature poodle',
    'miniature schnauzer',
    'miniature schnoxie',
    'mixed breed',
    'morkie',
    'neapolitan mastiff',
    'newfoundland',
    'new zealand huntaway',
    'norfolk terrier',
    'northern inuit',
    'norwegian buhund',
    'norwegian elkhound',
    'norwich terrier',
    'nova scotia duck tolling retriever',
    'old english sheepdog',
    'otterhound',
    'papillon',
    'parson russell terrier',
    'patterdale terrier',
    'peek-a-poo',
    'pekingese',
    'pembroke welsh corgi',
    'petit basset griffon vendeen',
    'pharaoh hound',
    'picardy sheepdog',
    'pitsky',
    'plott hound',
    'pointer',
    'polish lowland sheepdog',
    'pomapoo',
    'pomchi',
    'pomeranian',
    'pomsky',
    'poodle',
    'portuguese podengo',
    'portuguese pointer',
    'portuguese water dog',
    'powderpuff chinese crested',
    'pug',
    'pugalier',
    'pugapoo',
    'puggle',
    'pugzu',
    'pyrenean mastiff',
    'pyrenean shepherd',
    'rat terrier',
    'redbone coonhound',
    'rescue dog',
    'rhodesian ridgeback',
    'rottweiler',
    'rough collie',
    'russian toy',
    'saluki',
    'samoyed',
    'schipperke',
    'schnauzer',
    'schnoodle',
    'scottish terrier',
    'sealyham terrier',
    'segugio italiano',
    'shar pei',
    'sheepadoodle',
    'shetland sheepdog',
    'shih-poo',
    'shih tzu',
    'shollie',
    'shorkie',
    'siberian cocker',
    'siberian husky',
    'skye terrier',
    'sloughi',
    'slovakian rough haired pointer',
    'small munsterlander',
    'smooth collie',
    'soft coated wheaten terrier',
    'spanish water dog',
    'sporting lucas terrier',
    'springador',
    'springer spaniel',
    'sprocker',
    'sprollie',
    'sproodle',
    'stabyhoun',
    'staffador',
    'staffordshire bull terrier',
    'staffy jack',
    'st. bernard',
    'sussex spaniel',
    'swedish lapphund',
    'swedish vallhund',
    'tamaskan',
    'terri-poo',
    'tibetan mastiff',
    'tibetan spaniel',
    'tibetan terrier',
    'toy fox terrier',
    'toy poodle',
    'trailhound',
    'treeing walker coonhound',
    'turkish kangal dog',
    'weimaraner',
    'welsh springer spaniel',
    'welsh terrier',
    'west highland white terrier',
    'westiepoo',
    'whippet',
    'white swiss shepherd dog',
    'working cocker spaniel',
    'yorkie russell',
    'yorkipoo',
    'yorkshire terrier',
    'zuchon',
  ]
  const dogFound = results.filter((dog) =>
    dogBreeds.includes(dog.className.toLowerCase())
  )

  const triggerUpload = () => {
    fileInputRef.current.click()
    setHideText(true)
  }

  useEffect(() => {
    loadModel()
  }, [])

  if (isModelLoading) {
    return (
      <>
        <LoadingSpinner />
      </>
    )
  }

  return (
    <>
      <div className="mascot">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="145.374"
          height="126.629"
          viewBox="0 0 145.374 126.629"
        >
          <g
            id="Group_44"
            data-name="Group 44"
            transform="translate(-899.089 -2912.469)"
          >
            <g
              id="Group_43"
              data-name="Group 43"
              transform="translate(899.089 2912.469)"
            >
              <g id="Group_42" data-name="Group 42">
                <circle
                  id="Ellipse_6"
                  data-name="Ellipse 6"
                  cx="38.874"
                  cy="38.874"
                  r="38.874"
                  transform="matrix(0.999, 0.052, -0.052, 0.999, 35.652, 22.633)"
                  fill="#fff"
                />
                <path
                  id="Path_24"
                  data-name="Path 24"
                  d="M13.425,31.623c7.33-9.707,12.6-14.88,16.4-16.424A40.135,40.135,0,0,1,93.9,16.767a18.448,18.448,0,0,1,4.8,3.505,67.936,67.936,0,0,1,10.418,11.35c11.031,14.586,16.326,29.147,11.84,32.505-3.6,2.7-12.429-2.647-21.474-12.4a40.1,40.1,0,0,1-76.385.147C13.842,62.093,5.238,66.849,1.61,64.128-2.9,60.77,2.394,46.209,13.425,31.623ZM61.276,76.508a36.873,36.873,0,0,0,35.717-27.6c-.392-.441-.784-.907-1.152-1.373-7.869,5.27-21.915,5.418-27.97-1.986-7.869-9.634-.76-21.18,7.158-27.112a17.844,17.844,0,0,1,13.385-3.383,36.953,36.953,0,0,0-54.421.123,4.031,4.031,0,0,1,.539.343c4.511,3.334-.809,22.749-4.9,28.289-1.373,1.863-2.746,3.6-4.094,5.221A36.984,36.984,0,0,0,61.276,76.508ZM81.77,35.913a5.565,5.565,0,1,0-5.565,5.54A5.555,5.555,0,0,0,81.77,35.913Z"
                  transform="matrix(0.891, 0.454, -0.454, 0.891, 36.169, 0)"
                />
                <ellipse
                  id="Ellipse_1"
                  data-name="Ellipse 1"
                  cx="2.035"
                  cy="2.008"
                  rx="2.035"
                  ry="2.008"
                  transform="matrix(0.891, 0.454, -0.454, 0.891, 88.648, 62.748)"
                />
                <path
                  id="Path_25"
                  data-name="Path 25"
                  d="M6.094,0A6.068,6.068,0,1,1,0,6.067,6.084,6.084,0,0,1,6.094,0ZM7.464,5.772A1.718,1.718,0,1,0,5.718,4.054,1.772,1.772,0,0,0,7.464,5.772Z"
                  transform="matrix(0.891, 0.454, -0.454, 0.891, 58.585, 44.985)"
                  fill="#b1832d"
                />
                <path
                  id="Path_26"
                  data-name="Path 26"
                  d="M2.868,12.364a5.421,5.421,0,0,0,9.047-3.785V8.551c-1.879-1.1-4.645-3.114-4.645-5.423,0-3.517,2.738-3.114,6.282-3.114,3.517,0,6.5-.4,6.5,3.114,0,2.309-2.765,4.322-4.645,5.423h0a5.39,5.39,0,0,0,5.4,5.181,5.58,5.58,0,0,0,3.651-1.4,1.769,1.769,0,0,1,2.47.107,1.736,1.736,0,0,1-.107,2.443A8.8,8.8,0,0,1,20.828,17.2a8.9,8.9,0,0,1-7.141-3.571A8.922,8.922,0,0,1,.559,14.887a1.736,1.736,0,0,1-.107-2.443A1.7,1.7,0,0,1,2.868,12.364Z"
                  transform="matrix(0.891, 0.454, -0.454, 0.891, 56.115, 65.783)"
                />
                <path
                  id="Path_45"
                  data-name="Path 45"
                  d="M6.094,0A6.068,6.068,0,1,1,0,6.067,6.084,6.084,0,0,1,6.094,0ZM7.464,5.772A1.718,1.718,0,1,0,5.718,4.054,1.772,1.772,0,0,0,7.464,5.772Z"
                  transform="matrix(0.891, 0.454, -0.454, 0.891, 84.938, 58.681)"
                  fill="#b1832d"
                />
              </g>
            </g>
          </g>
        </svg>
      </div>
      <div className="image-identification">
        <input
          id="dogs-picture"
          onChange={fileSelected}
          type="file"
          accept="image/*"
          capture="camera"
          className="uploadInput"
          ref={fileInputRef}
        />

        <section>
          {!hideText && (
            <label htmlFor="dogs-picture">
              <div className="instructions">
                <p>
                  {' '}
                  &#10003; AI checks an image to match a breed. Mixed breed it
                  guesses but knows it&apos;s a dog.{' '}
                </p>

                <p>&#10003; Head shot & nothing in its mouth works best.</p>

                <p>&#10003; Portrait pics work best too!</p>

                <p>
                  &#10003; To convert native .heic image format imported from
                  your phone on a mac open the HEIC file in the Preview app, go
                  to File &gt; Export, select JPEG as the format, and save the
                  file for upload.
                </p>

                <p>
                  &#10003; To convert .heic to JPEG on an iPhone, navigate to
                  the HEIC photo you wish to convert and select it. Then, use
                  the ‘Share’ button and opt to copy it. The photo auto converts
                  to JPEG. Paste the file to a folder on your phone for upload.
                </p>
              </div>
            </label>
          )}
          {!dogFound?.length && (
            <button className="uploadImage" onClick={triggerUpload}>
              Upload Image
            </button>
          )}

          {dogFound.length === 0 && (
            <div className="resultsHolder">
              <div className="result">
                <span className="confidence"></span>
              </div>
            </div>
          )}
          {imageURL && (
            <>
              <button onClick={identify} className="button">
                Please identify image
              </button>
            </>
          )}

          {submitPicture && dogFound.length > 0 && (
            <form className="image-submit" onSubmit={submit}>
              <button className="edit-button" type="submit">
                Submit your dog!
              </button>
            </form>
          )}
          {dogFound.length > 0 && (
            <div className="resultsHolder">
              {dogFound.map((dog, index) => (
                <div className="result" key={dog.className}>
                  <span className="name">
                    <strong>{dog.className}</strong>{' '}
                  </span>
                  <span className="confidence">
                    Confidence level:{' '}
                    <span>{(dog.probability * 100).toFixed(2)}%</span>
                    {index === 0 && (
                      <>
                        <hr />
                        <span className="bestGuess">Best Guess</span>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
        <div className="imageHolder">
          {imageURL && (
            <img
              src={imageURL}
              alt="Upload Preview"
              crossOrigin="anonymous"
              ref={imageRef}
            />
          )}
        </div>
      </div>
    </>
  )
}
export default ImageUpload
