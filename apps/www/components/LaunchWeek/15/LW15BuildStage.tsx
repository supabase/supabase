import React, { FC } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { cn } from 'ui'

import { buildDays as days } from 'components/LaunchWeek/15/data'
import SectionContainer from 'components/Layouts/SectionContainer'

const LW15BuildStage: FC = () => {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { margin: '-25%', once: true })

  const variants = {
    reveal: {
      transition: {
        type: 'spring',
        damping: 10,
        mass: 0.75,
        stiffness: 100,
        staggerChildren: 0.08,
      },
    },
  }

  return (
    <>
      <SectionContainer
        className="!max-w-none lg:!container py-8 md:py-8 lw-nav-anchor flex flex-col lg:grid lg:grid-cols-5 gap-4 lg:gap-2"
        id="build-stage"
      >
        <div className="flex flex-col md:gap-2 h-full justify-between col-span-2">
          <h3 className="text-2xl lg:text-3xl">Build Stage</h3>
          <p className="text-xs">
            A collection of <br className="hidden lg:block" />
            surprise releases.
          </p>
        </div>
        <motion.ul
          ref={ref}
          variants={variants}
          animate={isInView ? 'reveal' : 'initial'}
          className="w-full flex flex-col lg:col-span-3"
        >
          {days.map((day, i) => (
            <li
              key={`${day.id}-${i}`}
              data-delay={i}
              className="first:border-t border-b border-strong"
            >
              {day.is_shipped ? (
                <Link
                  href={day.links[0].url}
                  className={cn(
                    'relative flex text-lg items-center gap-4 w-full dark:border-background-surface-300 p-4 text-foreground-light hover:text-foreground',
                    day.className
                  )}
                >
                  <span className="w-1.5 h-1.5 bg-current" />
                  <span>{day.title}</span>
                </Link>
              ) : (
                <div
                  className={cn(
                    'relative flex text-lg text-foreground-lighter items-center gap-4 w-full dark:border-background-surface-300 p-4 pointer-events-none',
                    day.className
                  )}
                >
                  <span className="w-1.5 h-1.5 bg-current" />
                  <span className="text-lg leading-snug">&#91; Access locked &#93;</span>
                </div>
              )}
            </li>
          ))}
        </motion.ul>
      </SectionContainer>
    </>
  )
}

export default LW15BuildStage
