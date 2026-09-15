'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import { SurveySectionBreak } from './SurveySectionBreak'

import './surveyResults.css'

const ROTATION_DURATION = 6000
const FILL_DURATION_MS = 5000
const BLINK_LEAD_MS = 300

export interface CarouselPullQuote {
  quote: string
  author: string
  authorPosition?: string
  authorAvatar?: string
  label?: string
}

export function SurveyPullQuoteCarousel({ quotes }: { quotes: CarouselPullQuote[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isBlinking, setIsBlinking] = useState(false)

  useEffect(() => {
    if (quotes.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % quotes.length)
    }, ROTATION_DURATION)

    return () => clearInterval(interval)
  }, [quotes.length])

  useEffect(() => {
    setIsAnimating(false)
    setIsBlinking(false)

    const startTimer = setTimeout(() => setIsAnimating(true), 50)
    const stopTimer = setTimeout(() => setIsAnimating(false), FILL_DURATION_MS + 50)
    const blinkTimer = setTimeout(() => setIsBlinking(true), ROTATION_DURATION - BLINK_LEAD_MS)
    const stopBlinkTimer = setTimeout(() => setIsBlinking(false), ROTATION_DURATION)

    return () => {
      clearTimeout(startTimer)
      clearTimeout(stopTimer)
      clearTimeout(blinkTimer)
      clearTimeout(stopBlinkTimer)
    }
  }, [currentIndex])

  const current = quotes[currentIndex]
  if (!current) return null

  return (
    <>
      <aside className="relative border-b border-muted md:border-b-0">
        <div
          className="absolute inset-0 pointer-events-none bg-surface-400 dark:bg-surface-75"
          style={{
            maskImage: 'url("/images/state-of-startups/pattern-stipple.svg")',
            maskSize: '4px',
            maskRepeat: 'repeat',
            maskPosition: 'top left',
          }}
        />
        <div className="relative max-w-240 mx-auto md:border-x border-muted flex flex-col gap-4 text-center items-center px-6 py-24 bg-alternative">
          {current.label && (
            <p className="text-foreground-lighter text-xs font-mono uppercase tracking-widest min-h-[1em]">
              {current.label}
            </p>
          )}
          <p
            className="text-foreground-lighter text-2xl tracking-tight text-balance max-w-prose"
            style={{ animation: isBlinking ? 'blink 100ms infinite' : 'none' }}
          >
            “{current.quote}”
          </p>
          {current.authorAvatar && (
            <Image
              src={current.authorAvatar}
              width={48}
              height={48}
              alt={`${current.author}'s avatar`}
              className="h-10 w-10 overflow-hidden rounded-full border border-control"
            />
          )}
          <p>
            {current.author}
            {current.authorPosition && (
              <>
                <br />
                <span className="text-foreground-muted text-sm">{current.authorPosition}</span>
              </>
            )}
          </p>

          {quotes.length > 1 && (
            <div aria-hidden="true" className="w-24 h-1 relative overflow-hidden mt-2">
              <div
                className="absolute inset-0 pointer-events-none bg-foreground-muted/80"
                style={{
                  maskImage: 'url("/images/state-of-startups/pattern-stipple.svg")',
                  maskSize: '4px',
                  maskRepeat: 'repeat',
                  maskPosition: 'center',
                }}
              />
              <div
                key={currentIndex}
                className="h-full relative bg-surface-100"
                style={{
                  width: '100%',
                  clipPath: isAnimating ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
                  transition: isAnimating
                    ? `clip-path ${FILL_DURATION_MS}ms steps(5, end)`
                    : 'clip-path 0s',
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none bg-brand"
                  style={{
                    maskImage: 'url("/images/state-of-startups/pattern-checker.svg")',
                    maskSize: '4px',
                    maskRepeat: 'repeat',
                    maskPosition: 'center',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </aside>
      <SurveySectionBreak className="hidden md:block" />
    </>
  )
}
