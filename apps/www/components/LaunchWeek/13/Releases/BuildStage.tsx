import React, { FC } from 'react'
import { buildDays as days } from '~/components/LaunchWeek/13/Releases/data'

import SectionContainer from '~/components/Layouts/SectionContainer'
import BuildCard from './components/BuildCard'
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
      <SectionContainer className="!max-w-none lg:!container lw-nav-anchor" id="build-stage">
        <div className="flex flex-col md:flex-row md:gap-2 pb-4 md:pb-8 text-sm tracking-widest font-mono uppercase">
          <h3 className="text-foreground ">Build Stage</h3>
          <p className="text-foreground-lighter">A collection of surprise releases</p>
        </div>
        <motion.ul
          ref={ref}
          variants={variants}
          animate={isInView ? 'reveal' : 'initial'}
          className="w-full grid gap-2 sm:gap-3 xl:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
        >
          {days.map((day, i) => (
            <li
              key={`${day.id}-${i}`}
              className={cn(
                'relative flex flex-col w-full aspect-video max-h-[250px] sm:aspect-square rounded-xl border border-dashed border-strong dark:border-background-surface-300 bg-surface-100/10 col-span-1',
                day.className
              )}
              data-delay={i}
            >
              <BuildCard day={day} index={i} />
              {!day.is_shipped && (
                <div className="absolute m-4 md:m-6 lg:m-8">
                  <svg
                    width="16"
                    height="17"
                    viewBox="0 0 16 17"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g opacity="0.5">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M3.9999 7.55557V5.95557C3.9999 3.74643 5.79076 1.95557 7.9999 1.95557C10.209 1.95557 11.9999 3.74643 11.9999 5.95557V7.55557C12.8836 7.55557 13.5999 8.27191 13.5999 9.15557V13.1556C13.5999 14.0392 12.8836 14.7556 11.9999 14.7556H3.9999C3.11625 14.7556 2.3999 14.0392 2.3999 13.1556V9.15557C2.3999 8.27191 3.11625 7.55557 3.9999 7.55557ZM10.3999 5.95557V7.55557H5.5999V5.95557C5.5999 4.63008 6.67442 3.55557 7.9999 3.55557C9.32539 3.55557 10.3999 4.63008 10.3999 5.95557Z"
                        fill="hsl(var(--foreground-lighter))"
                      />
                    </g>
                  </svg>
                </div>
              )}
            </li>
          ))}
        </motion.ul>
      </SectionContainer>
    </>
  )
}

export default BuildStage
