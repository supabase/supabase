import React from 'react'
import SectionContainer from '../Layouts/SectionContainer'
import InteractiveShimmerCard from '../InteractiveShimmerCard'

interface Highlight {
  image: string
  title: string
  paragraph: string
}

const HighlightCards = ({ highlights }: { highlights: Highlight[] }) => {
  return (
    <SectionContainer>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {highlights.map((highlight) => (
          <InteractiveShimmerCard innerClassName="flex flex-col p-8 !bg-scale-200">
            <div className="w-full aspect-square mb-4">image</div>
            <h3 className="text-lg text-scale-1200 font-medium mb-2">{highlight.title}</h3>
            <p>{highlight.paragraph}</p>
          </InteractiveShimmerCard>
        ))}
      </div>
    </SectionContainer>
  )
}

export default HighlightCards
