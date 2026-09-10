'use client'

import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const ScrollProgress = () => {
  const [progressPercentage, setProgressPercentage] = useState(0)
  const pathname = usePathname()

  const isBlogPost = /^\/blog\/[^/]+\/?$/.test(pathname ?? '')

  const handleScroll = () => {
    if (typeof document === 'undefined') return null
    const article = document?.querySelector('article')
    if (!article) return null
    const { top, height } = (article as any)?.getBoundingClientRect()
    let scrollDistance = -top
    let progressPercentage =
      (scrollDistance / (height - document.documentElement.clientHeight)) * 100
    setProgressPercentage(progressPercentage)
  }

  useEffect(() => {
    if (!isBlogPost) return
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isBlogPost])

  if (!isBlogPost) return null

  let isActive = progressPercentage <= 100

  return (
    <div className="relative h-[2px] w-full overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 right-0 h-full bg-brand will-change-transform transition-opacity"
        style={{
          display: isActive ? 'absolute' : 'relative',
          transform: `translate3d(${isActive ? progressPercentage - 100 + '%' : '0'},0,0)`,
          opacity: isActive ? 1 : 0,
        }}
      />
    </div>
  )
}

export default ScrollProgress
