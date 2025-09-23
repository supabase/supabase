import React, { FC } from 'react'

import SectionContainer from '~/components/Layouts/SectionContainer'
import UsersGrowthChart from '~/components/UsersGrowthChart'

interface Props {
  id: string
  heading: string | JSX.Element
  subheading: string | JSX.Element
  highlights: Highlight[]
}

type Highlight = {
  heading: string
  subheading: string
}

const Performance: FC<Props> = (props) => {
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
      <UsersGrowthChart />
    </SectionContainer>
  )
}

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

export default Performance
