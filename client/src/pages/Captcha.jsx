import { useState } from 'react'

function App() {
  const [buttonClicked, setButtonClicked] = useState(false)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Or any other key combination
      setButtonClicked(true)
    }
  }

  return (
    <div onKeyDown={handleKeyDown} tabIndex={0}>
      <button onClick={() => setButtonClicked(true)}>Click Me</button>
      {buttonClicked && <p>Button Clicked!</p>}
    </div>
  )
}

export default App
