import React, { FC } from 'react'
import type { LucideIcon } from 'lucide-react'

import { cn, TextLink } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'

interface Props {
  id: string
  label: string | JSX.Element
  heading: string | JSX.Element
  subheading: string | JSX.Element
  features?: FeatureProps[]
  className?: string
  cta?: {
    label: string
    url: string
  }
}

export type Story = {
  url: string
  heading: string
  subheading: string | JSX.Element
}

type FeatureProps = {
  icon: LucideIcon
  heading: string
}

const CronSection: FC<Props> = (props) => {
  return (
    <SectionContainer
      id={props.id}
      className={cn('flex flex-col xl:flex-row justify-between gap-4 md:gap-8', props.className)}
    >
      <ul className="w-full h-[300px] flex-grow grid grid-cols-2 sm:grid-cols-2 gap-4 md:gap-x-20 xl:grid-cols-2 border border-muted rounded-lg bg-surface-100">
        {props.features?.map((feature) => <FeatureItem feature={feature} key={feature.heading} />)}
      </ul>
      <div className="flex flex-col gap-2 max-w-xl">
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

interface FeatureItemProps {
  feature: FeatureProps
}

const FeatureItem: FC<FeatureItemProps> = ({ feature }) => {
  const Icon: LucideIcon = feature.icon

  return (
    <li className="flex flex-nowrap items-center h-fit gap-2 sm:gap-4 text-foreground text-xs sm:text-sm">
      <figure className="border not-prose bg-surface-100 flex h-8 w-8 items-center justify-center rounded-md">
        <Icon className="w-4 h-4 stroke-1" />
      </figure>
      <p>{feature.heading}</p>
    </li>
  )
}

export default CronSection
