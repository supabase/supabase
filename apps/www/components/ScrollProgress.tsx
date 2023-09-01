import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

const ScrollProgress = () => {
  const [progressPercentage, setProgressPercentage] = useState(0)
  const { pathname } = useRouter()

  const isBlogPost = pathname.includes('/blog/')
  if (!isBlogPost) return null

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
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  let isActive = progressPercentage <= 100

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
