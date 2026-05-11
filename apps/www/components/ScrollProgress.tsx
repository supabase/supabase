'use client'

import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const ScrollProgress = () => {
  const [progressPercentage, setProgressPercentage] = useState(0)
  const pathname = usePathname()

  const isBlogPost = pathname?.includes('/blog/')

  useEffect(() => {
    if (!isBlogPost) return

    const handleScroll = () => {
      const article = document?.querySelector('article')
      if (!article) return
      const { top, height } = article.getBoundingClientRect()
      const scrollDistance = -top
      const progress =
        (scrollDistance / (height - document.documentElement.clientHeight)) * 100
      setProgressPercentage(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isBlogPost])

  if (!isBlogPost) return null

  const isActive = progressPercentage <= 100

  return (
    <div className="h-[2px] w-full flex justify-start relative">
      <div
        className="h-full top-0 bottom-0 right-0 absolute w-screen bg-brand will-change-transform transition-opacity"
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
