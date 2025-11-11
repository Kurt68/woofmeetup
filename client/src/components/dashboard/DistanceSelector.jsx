import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const DistanceSelector = ({ selectDistance, onDistanceChange }) => {
  const distanceOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 1024)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close dropdown when clicking outside (mobile only)
  useEffect(() => {
    function handleClickOutside(event) {
      if (!isDesktop && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDesktop])

  const handleSelect = (value) => {
    onDistanceChange({ target: { value } })
    setIsOpen(false)
  }

  const handleMouseEnter = () => {
    if (isDesktop) {
      setIsOpen(true)
    }
  }

  const handleMouseLeave = () => {
    if (isDesktop) {
      setIsOpen(false)
    }
  }

  const selectedLabel = `${selectDistance} miles`

  return (
    <div className="select-distance">
      <section>
        <div 
          className="custom-dropdown" 
          ref={dropdownRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            className="dropdown-trigger"
            onClick={() => !isDesktop && setIsOpen(!isOpen)}
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
