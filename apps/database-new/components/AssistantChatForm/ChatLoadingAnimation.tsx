import { useState, useEffect } from 'react'

// something a little funny here maybe?
const textArray = [
  "We're working hard to compute your results",
  'Installing a new flux capacitor',
  'Reconfiguring the warp drive',
  'Analyzing the space modulator',
  'etc....',
]

// this is just an idea.
// maybe a bad one
// needs better animation if we're keeping it
const ChatLoadingAnimation = () => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [currentText, setCurrentText] = useState(textArray[0])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % textArray.length)
      setCurrentText(textArray[currentTextIndex])
    }, 2000)

    return () => {
      clearInterval(interval)
    }
  }, [currentTextIndex, textArray])

  return (
    <div>
      <h1>{currentText}</h1>
    </div>
  )
}

export default ChatLoadingAnimation
