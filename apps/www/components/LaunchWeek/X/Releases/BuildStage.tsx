import * as React from 'react'
import { buildDays as days } from '~/components/LaunchWeek/X/Releases/data'

import SectionContainer from '~/components/Layouts/SectionContainer'
import AdventCard from './components/AdventCard'
import { motion, useInView } from 'framer-motion'

export default function BuildStage() {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { margin: '-25%', once: true })

  React.useEffect(() => {
    console.log('isInView', isInView)
  }, [isInView])

  const variants = {
    initial: {
      // rotateY: -90,
      // opacity: 0,
    },
    reveal: {
      // rotateY: 0,
      // opacity: 1,
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
      <SectionContainer className="!max-w-none lg:!container">
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
              className="relative flex flex-col w-full aspect-square rounded-xl border border-muted/50 bg-surface-100/10"
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
