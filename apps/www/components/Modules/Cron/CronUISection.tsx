import React, { FC } from 'react'

import { cn, TextLink } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'

interface Props {
  id: string
  label: string | JSX.Element
  heading: string | JSX.Element
  subheading: string | JSX.Element
  image?: any
  className?: string
  cta?: {
    label: string
    url: string
  }
}

const CronUISection: FC<Props> = (props) => {
  return (
    <SectionContainer
      id={props.id}
      className={cn(
        'flex flex-col xl:flex-row mx-auto max-w-6xl justify-between lg:items-center gap-4 md:gap-8',
        props.className
      )}
    >
      <div className="w-full max-w-[490px] h-full rounded-lg overflow-hidden border shadow-lg">
        {props.image}
      </div>
      <div className="flex flex-grow flex-col gap-2 max-w-xl">
        <span className="label">{props.label}</span>
        <h2 className="h2 !m-0">{props.heading}</h2>
        <p className="p !text-foreground-lighter">{props.subheading}</p>
        {props.cta && (
          <TextLink hasChevron label={props.cta.label} url={props.cta.url} className="mt-2" />
        )}
      </div>
    </SectionContainer>
  )
}

export default CronUISection
