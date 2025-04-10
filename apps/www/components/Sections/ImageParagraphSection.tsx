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
  reverse?: boolean
}

const ImageLeftSection: FC<Props> = (props) => {
  return (
    <SectionContainer
      id={props.id}
      className={cn(
        'flex flex-col md:flex-row mx-auto lg:max-w-6xl justify-between items-center gap-8',
        props.className
      )}
    >
      <div className="w-full max-w-md h-full object-cover flex-grow bg-200 shadow-lg border rounded-lg overflow-hidden image-container">
        {props.image}
      </div>
      <div
        className={cn(
          'flex order-first md:order-last flex-grow flex-col gap-2 max-w-md paragraph-container',
          props.reverse && 'md:order-first'
        )}
      >
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

export default ImageLeftSection
