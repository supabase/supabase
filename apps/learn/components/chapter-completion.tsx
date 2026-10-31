'use client'

import { Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocalStorage } from './use-local-storage'

interface ChapterCompletionProps {
  chapterNumber: number
  completionMessage?: string
}

export function ChapterCompletion({ chapterNumber, completionMessage }: ChapterCompletionProps) {
  const [completedChapters, setCompletedChapters] = useLocalStorage<number[]>(
    'completed-chapters',
    []
  )
  const [isCompleted, setIsCompleted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Check if chapter is already completed on mount
  useEffect(() => {
    if (completedChapters.includes(chapterNumber)) {
      setIsCompleted(true)
    }
  }, [chapterNumber, completedChapters])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          } else {
            setIsVisible(false)
            // Reset timer if user scrolls away
            if (timerRef.current) {
              clearTimeout(timerRef.current)
              timerRef.current = null
            }
          }
        })
      },
      {
        threshold: 0.5, // Trigger when 50% of the component is visible
        rootMargin: '0px',
      }
    )

    observer.observe(container)

    return () => {
      observer.disconnect()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isVisible && !isCompleted) {
      // Start timer when component becomes visible
      timerRef.current = setTimeout(() => {
        setIsCompleted(true)
        // Save to local storage
        if (!completedChapters.includes(chapterNumber)) {
          setCompletedChapters([...completedChapters, chapterNumber])
        }
      }, 5000) // 5 seconds
    } else if (!isVisible && timerRef.current) {
      // Clear timer if user scrolls away before completion
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isVisible, isCompleted, chapterNumber, completedChapters, setCompletedChapters])

  return (
    <div ref={containerRef} className="mb-16 mt-8">
      <div className="flex items-center gap-12">
        {/* Large circle with chapter number */}
        <div className="relative mb-6">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
              isCompleted ? 'bg-green-50' : 'bg-muted'
            }`}
          >
            <span
              className={`text-4xl font-bold transition-all duration-500 ${
                isCompleted ? 'text-brand-500' : 'text-foreground-muted'
              }`}
            >
              {chapterNumber}
            </span>
          </div>

          {/* Small checkmark circle overlapping bottom-right */}
          <div
            className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-500 ${
              isCompleted ? 'bg-brand-500 scale-100 opacity-100' : 'bg-muted scale-75 opacity-0'
            }`}
          >
            <Check
              className={`h-6 w-6 text-white transition-all duration-300 ${
                isCompleted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}
              strokeWidth={3}
            />
          </div>
        </div>
        <div>
          {/* Completion text */}
          <h3
            className={`text-2xl font-bold mb-2 transition-all duration-500 ${
              isCompleted
                ? 'text-foreground opacity-100 translate-y-0'
                : 'text-foreground-muted opacity-60 translate-y-2'
            }`}
          >
            You&apos;ve completed Chapter {chapterNumber}
          </h3>

          {completionMessage && (
            <p
              className={`text-base max-w-2xl transition-all duration-500 delay-100 ${
                isCompleted
                  ? 'text-foreground-light opacity-100 translate-y-0'
                  : 'text-foreground-light opacity-0 translate-y-2'
              }`}
            >
              {completionMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
