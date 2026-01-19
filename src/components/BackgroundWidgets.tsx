import React, { useState, useRef } from 'react'
import '../App.css'
import './BackgroundWidgets.css'

const BackgroundWidgets: React.FC = () => {
  const [showImage, setShowImage] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const clickCountRef = useRef(0)
  const clickTimesRef = useRef<number[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleDataTransferClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Restart shake animation by changing key
    setShakeKey(prev => prev + 1)

    const now = Date.now()
    clickTimesRef.current.push(now)

    // Keep only clicks within last 800ms
    clickTimesRef.current = clickTimesRef.current.filter(time => now - time < 800)

    const clickCount = clickTimesRef.current.length
    console.log('Clicks:', clickCount)

    // If we have 5 clicks within 800ms
    if (clickCount >= 5) {
      setShowImage(true)
      setIsFadingOut(false)
      clickCountRef.current = 0
      clickTimesRef.current = []
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      // Start fade out after 400ms
      setTimeout(() => {
        setIsFadingOut(true)
        setTimeout(() => {
          setShowImage(false)
          setIsFadingOut(false)
        }, 500) // Fade out duration
      }, 400)
    } else {
      // Reset if too slow
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        clickCountRef.current = 0
        clickTimesRef.current = []
        console.log('Reset clicks')
      }, 800)
    }
  }

  return (
    <div className="background-widgets">
      {showImage && (
        <div className={`easter-egg-image ${isFadingOut ? 'fade-out' : ''}`}>
          <img src="/67.png" alt="Easter Egg" />
        </div>
      )}
      <div className="data-transfer-wrapper">
        <div 
          key={shakeKey}
          className="bg-panel small data-transfer shake"
          onClick={handleDataTransferClick}
          style={{ cursor: 'pointer' }}
        >
          <div className="bg-panel-header">DATA TRANSFER ONLINE</div>
          <div className="bg-panel-body">
            67%
            <img 
              src="/pointer.png" 
              alt="Pointer" 
              className="data-transfer-pointer"
            />
          </div>
        </div>
      </div>
      <div className="bg-panel medium swap-intelligence">
        <div className="bg-panel-header">SWAP INTELLIGENCE</div>
        <div className="bg-panel-body">
          <span className="watching-text">WATCHING</span>
          <span className="loading-dots">
            <span className="dot">.</span>
            <span className="dot">.</span>
            <span className="dot">.</span>
          </span>
        </div>
      </div>
      <div className="bg-panel wide monitoring">
        <div className="bg-panel-header">MONITORING ONLINE</div>
        <div className="bg-panel-body">
          <span className="signal-value">SIGNAL 100%</span>
        </div>
      </div>
    </div>
  )
}

export default BackgroundWidgets

