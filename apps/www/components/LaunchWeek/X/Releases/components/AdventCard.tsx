import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Tilt from 'vanilla-tilt'
import { useWindowSize } from 'react-use'
import { cn } from 'ui'
import { useBreakpoint } from 'common'

import { AdventDay } from '../data'
import { AdventLink } from '../data/lwx_advent_days'

const AdventCard = ({ day, index }: { day: AdventDay; index: number }) => {
  const isTablet = useBreakpoint(1024)
  const ticketRef = useRef<HTMLDivElement>(null)
  const hiddenRef = useRef<HTMLDivElement>(null)
  const { width } = useWindowSize()
  const [hiddenHeight, setHiddenHeight] = useState(0)
  const transition = { type: 'spring', damping: 10, mass: 0.75, stiffness: 100, delay: index / 15 }
  const variants = {
    initial: {
      rotateY: -90,
      opacity: 0,
    },
    ...(day.is_shipped && {
      reveal: {
        rotateY: 0,
        opacity: 1,
        transition,
      },
    }),
  }

  useEffect(() => {
    if (ticketRef.current) {
      Tilt.init(ticketRef.current, {
        glare: false,
        max: 4,
        gyroscope: false,
        'full-page-listening': false,
      })
    }
  }, [ticketRef])

  useEffect(() => {
    if (hiddenRef?.current) {
      const { height } = hiddenRef.current.getBoundingClientRect()
      setHiddenHeight(height)
    }
  }, [hiddenRef, width])

  return (
    <div
      id={day.id}
      ref={ticketRef}
      className="absolute -inset-px group"
      style={{
        perspective: '1000px',
      }}
    >
      <motion.div
        className="opacity-0 flex flex-col justify-between w-full h-full p-6 rounded-xl bg-[#121516] transition-colors text-[#575E61] border hover:border-strong overflow-hidden"
        variants={variants}
      >
        <div className="opacity-30 group-hover:opacity-100 transition-opacity">{day.icon}</div>
        <div
          className={cn(
            'relative group-hover:!bottom-0 !ease-[.25,.25,0,1] duration-300 transition-all flex flex-col gap-1'
          )}
          style={{
            bottom: isTablet ? 0 : -hiddenHeight + 'px',
          }}
        >
          <h4 className="text-foreground text-lg">{day.title}</h4>
          <div
            ref={hiddenRef}
            className="relative z-10 !ease-[.25,.25,0,1] duration-300 transition-opacity opacity-100 lg:opacity-0 group-hover:opacity-100"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'translateZ(0)',
              WebkitFontSmoothing: 'subpixel-antialiased',
            }}
          >
            <p className="text-[#575E61] text-sm">{day.description}</p>
            <div className="flex gap-1 mt-3 flex-wrap">
              {day.links?.map((link: AdventLink) => (
                <Link
                  key={link.url}
                  href={link.url}
                  target={link.target ?? '_self'}
                  className="px-2 py-1 pointer-events-auto border border-muted transition-colors text-foreground-light bg-[#191D1E] hover:bg-[#22272A] rounded text-xs"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AdventCard
