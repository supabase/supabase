import React, { FC } from 'react'

import SectionContainer from '~/components/Layouts/SectionContainer'

interface Props {
  id: string
  heading: string | JSX.Element
  subheading: string | JSX.Element
  // features: Feature[]
}

// type Feature = {
//   icon: LucideIcon
//   heading: string
//   subheading: string
// }

const Performance: FC<Props> = (props) => {
  return (
    <SectionContainer id={props.id} className="flex flex-col gap-4 md:gap-8">
      <div className="flex flex-col gap-2 max-w-xl">
        {/* <span className="label">{props.label}</span> */}
        <h2 className="h2 !m-0">{props.heading}</h2>
        <p className="p !text-foreground-lighter">{props.subheading}</p>
      </div>
      {/* <div className="grid grid-cols-1 gap-4 gap-y-10 md:grid-cols-3 md:gap-12 xl:gap-20">

      </div> */}
    </SectionContainer>
  )
}

export default Performance
