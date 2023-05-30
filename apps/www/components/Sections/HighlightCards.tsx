import React, { useRef } from 'react'
import { LazyMotion, domAnimation, m, useInView } from 'framer-motion'
import SectionContainer from '~/components/Layouts/SectionContainer'
import InteractiveShimmerCard from '~/components/InteractiveShimmerCard'
import { INITIAL_BOTTOM, getAnimation } from '~/lib/animations'
import Image from 'next/image'

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
  const isInView = useInView(ref, { once: true })

  const initial = INITIAL_BOTTOM
  const animate = getAnimation({ delay: 0.4 + index * 0.1 })

  return (
    <m.div ref={ref} initial={initial} animate={isInView ? animate : initial}>
      <InteractiveShimmerCard innerClassName="flex flex-col !bg-scale-200">
        <div className="relative w-full aspect-[1.35/1] mb-4">
          {highlight.image && highlight.image}
          {highlight.svg && highlight.svg}
        </div>
        <div className="p-8">
          <h3 className="text-lg text-scale-1200 font-medium mb-2">{highlight.title}</h3>
          <p className="text-scale-900">{highlight.paragraph}</p>
        </div>
      </InteractiveShimmerCard>
    </m.div>
  )
}

export default HighlightCards
