'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface LoadMoreCronJobsProps {
  onVisible?: () => void
  isLoading: boolean
}

export function LoadMoreCronJobs({ onVisible, isLoading }: LoadMoreCronJobsProps) {
  const divRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('effected')
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (isLoading) return
        console.log('intersected')
        if (entry.isIntersecting && onVisible) {
          onVisible()
        }
      },
      {
        rootMargin: '20px',
        threshold: 1.0,
      }
    )

    if (divRef.current) {
      observer.observe(divRef.current)
    }

    return () => observer.disconnect()
  }, [onVisible, isLoading])

  return (
    <div ref={divRef} className="relative">
      {isLoading && (
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
        </div>
      )}
    </div>
  )
}
