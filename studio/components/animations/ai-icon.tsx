// make a function that returns a component

import { useState, useEffect } from 'react'

const AiIconAnimation = () => {
  const [step, setStep] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((step) => {
        return (step % 5) + 1
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="ai-icon__container animate--[spin_5s_ease-in-out_infinite] spin-ai-icon-container">
      <div className="ai-icon__grid">
        <div className={`ai-icon__grid__square ai-icon__grid__square--step-${step}`}></div>
        <div className={`ai-icon__grid__square ai-icon__grid__square--step-${step}`}></div>
        <div className={`ai-icon__grid__square ai-icon__grid__square--step-${step}`}></div>
        <div className={`ai-icon__grid__square ai-icon__grid__square--step-${step}`}></div>
      </div>
    </div>
  )
}

export { AiIconAnimation }
