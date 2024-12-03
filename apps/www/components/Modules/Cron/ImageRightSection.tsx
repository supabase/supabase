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

const ImageRightSection: FC<Props> = (props) => {
  return (
    <SectionContainer
      id={props.id}
      className={cn(
        'mx-auto lg:max-w-6xl flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8',
        props.className
      )}
    >
      <div className="flex flex-col gap-2 max-w-md">
        {props.label && <span className="label">{props.label}</span>}
        <h2 className="h2 !m-0">{props.heading}</h2>
        <p className="p !text-foreground-lighter">{props.subheading}</p>
        {props.cta && (
          <TextLink hasChevron label={props.cta.label} url={props.cta.url} className="mt-2" />
        )}
      </div>
      <div className="w-full max-w-md md:max-w-xl h-full object-cover flex-grow bg-200 shadow-lg border rounded-lg overflow-hidden">
        {props.image}
      </div>
    </SectionContainer>
  )
}

export default ImageRightSection
