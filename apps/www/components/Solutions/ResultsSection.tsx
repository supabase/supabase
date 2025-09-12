import React, { FC } from 'react'
import { cn, Badge, AnimatedCounter } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { motion } from 'framer-motion'
import { useMedia } from 'react-use'

export interface ResultsSectionProps {
  id: string
  heading: string | JSX.Element
  subheading: string | JSX.Element
  highlights: Highlight[]
}

type Highlight = {
  heading: string
  subheading: string
}

const ResultsSection: FC<ResultsSectionProps> = (props) => {
  return (
    <SectionContainer id={props.id} className="relative">
      <div className="relative z-10 flex flex-col gap-4 md:gap-8 pb-20">
        <div className="flex flex-col gap-2 max-w-xl">
          {/* <span className="label">{props.label}</span> */}
          <h2 className="h2 !m-0">{props.heading}</h2>
          <p className="p !text-foreground-lighter">{props.subheading}</p>
        </div>
        <div className="flex flex-wrap gap-4 md:gap-12">
          {props.highlights.map((highlight) => (
            <HighlightItem key={highlight.heading} highlight={highlight} />
          ))}
        </div>
      </div>
      <div className="relative xl:absolute z-0 inset-0 mt-4 -mb-8 sm:mt-0 sm:-mb-20 md:-mt-20 md:-mb-36 xl:mt-0 xl:top-10 w-full aspect-[2.15/1]">
        <GraphLabel className="" />
        <GraphPath className="absolute inset-0 w-full h-full" />

        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1403 599"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full"
        >
          <path
            d="M1402.27 0.744141C896.689 410.854 286.329 492.876 0.476562 492.876V598.744H1402.27V0.744141Z"
            fill="url(#paint0_linear_585_9420)"
          />
          <path
            d="M11.4209 492.744C295.041 492.744 900.636 410.744 1402.27 0.744141"
            stroke="hsl(var(--foreground-lighter))"
          />
          <defs>
            <linearGradient
              id="paint0_linear_585_9420"
              x1="701.374"
              y1="170.846"
              x2="701.374"
              y2="561.839"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--border-overlay))" />
              <stop offset="1" stopColor="hsl(var(--border-overlay))" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 w-full h-full bg-[radial-gradient(50%_50%_at_50%_50%,_transparent_0%,_hsl(var(--background-default))_100%)]" />
      </div>
    </SectionContainer>
  )
}

const GraphLabel: FC<{ className?: string }> = ({ className }) => {
  const isMobileOrTablet = useMedia('(max-width: 1280px)')

  const motionProps = !isMobileOrTablet
    ? {
        initial: { offsetDistance: '0%', rotate: '0deg', opacity: 0 },
        whileInView: { offsetDistance: '80%', rotate: '30deg', opacity: 1 },
        viewport: { once: true },
        transition: { type: 'spring', duration: 2.68, bounce: 0, delay: 0.25 },
        style: {
          offsetPath: 'path("M0 493.132C285.852 493.132 896.213 411.11 1401.8 1")',
        },
      }
    : undefined

  const Component = isMobileOrTablet ? 'div' : motion.div

  return (
    <Component
      className={cn(
        'absolute z-10 -top-10 2xl:top-[20%] left-[38%] md:top-[10%] md:left-[50%] lg:top-0 xl:left-0 w-fit h-[200px] lg:h-[400px]',
        'flex flex-col items-center gap-1',
        className
      )}
      {...motionProps}
    >
      <div className="w-fit text-foreground bg-alternative p-4 rounded-lg border flex flex-col gap-1">
        <span className="label !text-[10px] !leading-3">Users</span>
        <div className="flex items-center gap-2">
          <span className="text-foreground-light text-2xl">
            {isMobileOrTablet ? (
              '5,230,550'
            ) : (
              <AnimatedCounter value={5230550} duration={2.68} delay={0.5} />
            )}
          </span>
          <Badge variant="success" size="small" className="h-[24px] px-2">
            {isMobileOrTablet ? (
              '+28.3%'
            ) : (
              <AnimatedCounter
                value={28.3}
                duration={2.68}
                delay={0.5}
                isPercentage={true}
                prefix="+"
              />
            )}
          </Badge>
        </div>
      </div>
      <div
        className={cn(
          'relative w-2 h-2 min-w-2 min-h-2 rounded-full border-2 border-stronger',
          'after:absolute after:inset-0 after:top-full after:mx-auto after:w-[2px] after:h-[150px] after:lg:h-[250px]',
          'after:bg-gradient-to-b after:from-border-stronger after:to-transparent'
        )}
      />
    </Component>
  )
}

const GraphPath: FC<{ className?: string }> = ({ className }) => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 1403 494"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <motion.path
      transition={{ duration: 0.5, delay: 0.5 }}
      initial={{ pathLength: 0.001 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: true }}
      d="M0 493.132C285.852 493.132 896.213 411.11 1401.8 1"
    />
  </svg>
)

interface HighlightItemProps {
  highlight: Highlight
}

const HighlightItem: FC<HighlightItemProps> = ({ highlight }) => {
  return (
    <li className="flex flex-col gap-2 text-sm">
      <span className="label">{highlight.heading}</span>
      <p className="text-foreground text-xl md:text-3xl">{highlight.subheading}</p>
    </li>
  )
}

export default ResultsSection
