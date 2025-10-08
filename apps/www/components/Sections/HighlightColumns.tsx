import React, { useRef, useState } from 'react'
import { INITIAL_BOTTOM, getAnimation } from '~/lib/animations'

interface Highlight {
  image?: React.ReactNode
  svg?: React.ReactNode
  title: string
  paragraph: string | React.ReactNode
}

const HighlightColumns = ({ highlights }: { highlights: Highlight[] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 xl:gap-32">
      {highlights.map((highlight, i) => (
        <Highlight highlight={highlight} key={highlight.title} />
      ))}
    </div>
  )
}

const Highlight = ({ highlight }: { highlight: Highlight }) => {
  const Img: any = highlight.image

  return (
    <div className="flex flex-col">
      <div className="relative w-full mb-4">
        {highlight.image && <Img />}
        {highlight.svg && highlight.svg}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg text-foreground">{highlight.title}</h3>
        <p className="text-foreground-lighter">{highlight.paragraph}</p>
      </div>
    </div>
  )
}

export default HighlightColumns
