import { useState, useRef, useEffect } from 'react'
import { Tooltip } from 'react-tooltip'
import { Ellipsis } from 'lucide-react'
import '../../styles/components/truncated-bio.css'

const TruncatedBio = ({ text, isUserBio = false, dogName = '', meetup_type = '' }) => {
  const [shouldTruncate, setShouldTruncate] = useState(false)
  const [truncatedText, setTruncatedText] = useState(text)
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)
  const spanRef = useRef(null)
  const tooltipId = useRef(`truncated-bio-${Math.random().toString(36).substr(2, 9)}`)
  const closeTimeoutRef = useRef(null)
  const isMobileRef = useRef(false)

  const isDesktop = () => window.innerWidth >= 768

  useEffect(() => {
    const charLimits = {
      mobile: isUserBio ? 58 : 50,
      desktop: isUserBio ? 110 : 100,
    }

    const getCharLimit = () => {
      return isDesktop() ? charLimits.desktop : charLimits.mobile
    }

    const handleResize = () => {
      isMobileRef.current = !isDesktop()
      const limit = getCharLimit()
      if (text && text.length > limit) {
        setShouldTruncate(true)
        setTruncatedText(text.substring(0, limit).trim() + '...')
      } else {
        setShouldTruncate(false)
        setTruncatedText(text)
      }
    }

    isMobileRef.current = !isDesktop()
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [text, isUserBio])

  const handleEllipsisClick = () => {
    if (isMobileRef.current) {
      setIsTooltipOpen(prev => !prev)
    }
  }

  const handleEllipsisEnter = () => {
    if (isDesktop()) {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
      setIsTooltipOpen(true)
    }
  }

  const handleTooltipLeave = () => {
    if (isDesktop()) {
      closeTimeoutRef.current = setTimeout(() => {
        setIsTooltipOpen(false)
      }, 200)
    }
  }

  const handleTooltipEnter = () => {
    if (isDesktop() && closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMobileRef.current && isTooltipOpen && spanRef.current && !spanRef.current.contains(e.target)) {
        setIsTooltipOpen(false)
      }
    }

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isTooltipOpen) {
        setIsTooltipOpen(false)
      }
    }

    if (isTooltipOpen && isMobileRef.current) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
      return () => {
        document.removeEventListener('click', handleClickOutside)
        document.removeEventListener('keydown', handleEscapeKey)
      }
    }
  }, [isTooltipOpen])

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  const shouldShowEllipsis = shouldTruncate || (!isUserBio && dogName && meetup_type)
  const ellipsisSize = shouldTruncate ? 33 : 35

  return (
    <>
      <span
        ref={spanRef}
        className={`truncated-bio ${shouldTruncate ? 'truncated-bio--truncated' : ''}`}
      >
        {shouldShowEllipsis ? (
          <>
            {shouldTruncate ? truncatedText.slice(0, -3) : truncatedText}
            <Ellipsis 
              size={ellipsisSize}
              className="truncated-bio-ellipsis"
              data-tooltip-id={tooltipId.current}
              onClick={handleEllipsisClick}
              onMouseEnter={handleEllipsisEnter}
              onMouseLeave={handleTooltipLeave}
            />
          </>
        ) : (
          truncatedText
        )}
      </span>

      {shouldShowEllipsis && (
        <div
          onMouseEnter={handleTooltipEnter}
          onMouseLeave={handleTooltipLeave}
          style={{ display: 'contents' }}
        >
          <Tooltip
            id={tooltipId.current}
            className="truncated-bio-tooltip"
            place="top-end"
            offset={8}
            render={() => {
              const formattedText = text.replace(/\n\n+/g, '\n')
              const paragraphs = formattedText.split('\n').filter(p => p.trim())
              return (
                <div className="truncated-bio-tooltip-content">
                  <div className="truncated-bio-tooltip-text">
                    <div className="truncated-bio-tooltip-header">
                      <h3 className="truncated-bio-tooltip-title">
                        About Me and {dogName || 'Unknown'}
                      </h3>
                    </div>
                    {paragraphs.map((para, idx) => (
                      <div key={idx} style={{ marginTop: idx > 0 ? '.8rem' : '0' }}>
                        {para}
                      </div>
                    ))}
                  </div>
                </div>
              )
            }}
            events={isMobileRef.current ? ['click'] : ['hover']}
            isOpen={isTooltipOpen}
            delayHide={0}
            delayShow={0}
          />
        </div>
      )}
    </>
  )
}

export default TruncatedBio
