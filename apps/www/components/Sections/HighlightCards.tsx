import React, { useRef, useState } from 'react'
import { LazyMotion, domAnimation, m, useInView } from 'framer-motion'
import { INITIAL_BOTTOM, getAnimation } from '~/lib/animations'

import Panel from '~/components/Panel'
import SectionContainer from '~/components/Layouts/SectionContainer'

interface Highlight {
  image?: React.ReactNode
  svg?: React.ReactNode
  title: string
  paragraph: string | React.ReactNode
}

const HighlightCards = ({
  highlights,
  className,
}: {
  highlights: Highlight[]
  className?: string
  cols?: number
}) => {
  return (
    <SectionContainer className={className}>
      <LazyMotion features={domAnimation}>
        <div className="highlights-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {highlights.map((highlight, i) => (
            <HighlightCard highlight={highlight} index={i} key={highlight.title} />
          ))}
        </div>
      </LazyMotion>
    </SectionContainer>
  )
}

const HighlightCard = ({ highlight, index }: { highlight: Highlight; index: number }) => {
  const ref = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const isInView = useInView(ref, { once: true })

  const initial = INITIAL_BOTTOM
  const animate = getAnimation({})

  const Img: any = highlight.image

  return (
    <m.div
      ref={ref}
      initial={initial}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={isInView ? animate : initial}
      className="will-change-transform h-full highlight-card"
    >
      <Panel innerClassName="flex flex-col !bg-alternative" outerClassName="h-full">
        {highlight.image && (
          <div className="relative w-full aspect-[1.35/1] mb-4">
            <div
              className="absolute inset-0 w-full h-full z-10"
              style={{
                background: `radial-gradient(100% 50% at 50% 50%, transparent, hsl(var(--background-alternative-default)))`,
              }}
            />
            {highlight.image && <Img isHovered={isHovered} />}
          </div>
        )}
        <div className="p-4 md:p-8">
          {highlight.svg && (
            <div className="relative w-6 aspect-square mb-2 md:mb-4 text-foreground-light">
              {highlight.svg}
            </div>
          )}
          <h3 className="text-lg text-foreground md:mb-2">{highlight.title}</h3>
          <p className="text-foreground-lighter text-sm">{highlight.paragraph}</p>
        </div>
      </Panel>
    </m.div>
  )
}

export default HighlightCards
