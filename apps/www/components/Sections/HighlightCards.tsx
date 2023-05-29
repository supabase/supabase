import React from 'react'
import SectionContainer from '../Layouts/SectionContainer'
import InteractiveShimmerCard from '../InteractiveShimmerCard'

interface Highlight {
  image: string
  title: string
  paragraph: string | React.ReactNode
}

const HighlightCards = ({ highlights }: { highlights: Highlight[] }) => {
  return (
    <SectionContainer>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {highlights.map((highlight) => (
          <InteractiveShimmerCard innerClassName="flex flex-col !bg-scale-200">
            <div className="w-full aspect-square mb-4"></div>
            <div className="p-8">
              <h3 className="text-lg text-scale-1200 font-medium mb-2">{highlight.title}</h3>
              <p className="text-scale-900">{highlight.paragraph}</p>
            </div>
          </InteractiveShimmerCard>
        ))}
      </div>
    </SectionContainer>
  )
}

export default HighlightCards
