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

const HighlightCards = ({ highlights }: { highlights: Highlight[] }) => {
  return (
    <SectionContainer>
      <LazyMotion features={domAnimation}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
  const animate = getAnimation({ delay: 0.4 + index * 0.1 })

  const Img: any = highlight.image

  return (
    <m.div
      ref={ref}
      initial={initial}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={isInView ? animate : initial}
    >
      <Panel hasShimmer innerClassName="flex flex-col !bg-alternative">
        <div className="relative w-full aspect-[1.35/1] mb-4">
          <div
            className="absolute inset-0 w-full h-full z-10"
            style={{
              background: `radial-gradient(100% 50% at 50% 50%, transparent, hsl(var(--background-alternative-default)))`,
            }}
          />
          {highlight.image && <Img isHovered={isHovered} />}
          {highlight.svg && highlight.svg}
        </div>
        <div className="p-8">
          <h3 className="text-lg text-foreground mb-2">{highlight.title}</h3>
          <p className="text-foreground-lighter">{highlight.paragraph}</p>
        </div>
      </Panel>
    </m.div>
  )
}

export default HighlightCards
