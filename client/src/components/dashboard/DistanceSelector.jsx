import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const DistanceSelector = ({ selectDistance, onDistanceChange }) => {
  const distanceOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (value) => {
    onDistanceChange({ target: { value } })
    setIsOpen(false)
  }



  const selectedLabel = `${selectDistance} miles`

  return (
    <div className="select-distance">
      <section>
        <div 
          className="custom-dropdown" 
          ref={dropdownRef}
        >
          <button
            className="dropdown-trigger"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <span>{selectedLabel}</span>
            <ChevronDown size={18} />
          </button>

          {isOpen && (
            <ul className="dropdown-menu" role="listbox">
              {distanceOptions.map((distance) => (
                <li key={distance}>
                  <button
                    className={`dropdown-option ${
                      String(selectDistance) === String(distance)
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() => handleSelect(distance)}
                    role="option"
                    aria-selected={String(selectDistance) === String(distance)}
                  >
                    {distance} miles
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

export default DistanceSelector
