import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { AdventDay } from '../data'
import { motion } from 'framer-motion'
import Tilt from 'vanilla-tilt'

const AdventCard = ({ day, index }: { day: AdventDay; index: number }) => {
  const ticketRef = useRef<HTMLAnchorElement>(null)
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
    if (ticketRef.current && !window.matchMedia('(pointer: coarse)').matches) {
      Tilt.init(ticketRef.current, {
        glare: false,
        max: 7,
        gyroscope: false,
        'full-page-listening': false,
      })
    }
  }, [ticketRef])

  return (
    <Link
      ref={ticketRef}
      href={day.url}
      className="absolute -inset-px"
      style={{
        perspective: '1000px',
        // transform: 'translate3d(0, 0, 200px)',
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        className="opacity-0 flex flex-col justify-between w-full aspect-square p-4 md:p-8 rounded-xl bg-[#11171890] hover:bg-[#111718] transition-colors text-[#575E61] border hover:border-strong"
        variants={variants}
      >
        <span>Blog post</span>
        <div className="text-foreground text-lg">Lorem ipsum</div>
      </motion.div>
    </Link>
  )
}

export default AdventCard
