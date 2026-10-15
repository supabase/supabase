'use client'

import { useState } from 'react'
import { cn } from 'ui'

export interface LoadingBeamProps {
  isActive: boolean
  direction?: 'forward' | 'backward'
  className?: string
}

export const LoadingBeam = ({ isActive, direction = 'forward', className }: LoadingBeamProps) => {
  const [run, setRun] = useState(0)
  const [runDirection, setRunDirection] = useState(direction)
  const [wasActive, setWasActive] = useState(isActive)
  if (isActive !== wasActive) {
    setWasActive(isActive)
    if (isActive) {
      setRun((current) => current + 1)
      setRunDirection(direction)
    }
  }

  return (
    <div
      key={run}
      aria-hidden
      data-active={isActive ? '' : undefined}
      data-direction={runDirection}
      className={cn('loading-beam', className)}
    />
  )
}
