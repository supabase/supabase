import React, { FC } from 'react'
import { buildDays as days } from '~/components/LaunchWeek/X/Releases/data'

import SectionContainer from '~/components/Layouts/SectionContainer'
import AdventCard from './components/AdventCard'
import { motion, useInView } from 'framer-motion'
import { cn } from 'ui'

const BuildStage: FC = () => {
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
      <SectionContainer className="!max-w-none lg:!container" id="build-stage">
        <h3 className="text-foreground uppercase font-mono pb-4 md:pb-8 text-sm tracking-[0.1rem]">
          Build Stage
        </h3>
        <motion.ul
          ref={ref}
          variants={variants}
          animate={isInView ? 'reveal' : 'initial'}
          className="w-full grid gap-2 sm:gap-4 lg:gap-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          {days.map((day, i) => (
            <li
              key={day.id}
              className={cn(
                'relative flex flex-col w-full aspect-square rounded-xl border border-muted/50 bg-surface-100/10 col-span-1',
                day.className
              )}
              data-delay={i}
            >
              <AdventCard day={day} index={i} />
            </li>
          ))}
        </motion.ul>
      </SectionContainer>
    </>
  )
}

export default BuildStage
