import React, { FC } from 'react'

import { cn } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import type {
  Feature,
  FeaturesSection as FeaturesSectionType,
} from '~/data/solutions/solutions.utils'

const FeaturesSection: FC<FeaturesSectionType> = (props) => {
  return (
    <SectionContainer id={props.id} className="flex flex-col gap-4 md:gap-8">
      <div className="flex flex-col gap-2 max-w-xl">
        <span className="label">{props.label}</span>
        <h2 className="h2 text-foreground-lighter">{props.heading}</h2>
        {props.subheading && <p className="text-foreground-lighter mb-8">{props.subheading}</p>}
      </div>
      <ul
        className={cn(
          'grid grid-cols-1 gap-4 gap-y-10 md:grid-cols-3 md:gap-12 xl:gap-20',
          props.features?.length === 4 && 'md:grid-cols-2 xl:grid-cols-4'
        )}
      >
        {props.features?.map((feature: Feature, index: number) => (
          <FeatureItem feature={feature} key={index} />
        ))}
      </ul>
    </SectionContainer>
  )
}

interface FeatureItemProps {
  feature: Feature
}

const FeatureItem: FC<FeatureItemProps> = ({ feature }) => {
  const Icon = feature.icon
  const iconSize = 7
  const iconWidth = `w-${iconSize}`
  const iconHeight = `h-${iconSize}`

  return (
    <li className="flex flex-col gap-2 text-sm text-foreground-lighter">
      {Icon &&
        (typeof Icon === 'string' ? (
          <svg
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill={feature.iconNoStroke ? 'currentColor' : 'none'}
            className="w-7 h-7 mb-2"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d={Icon}
              fillRule="evenodd"
              clipRule="evenodd"
              stroke={feature.iconNoStroke ? 'none' : 'currentColor'}
              strokeMiterlimit="10"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="1"
            />
          </svg>
        ) : (
          <Icon className={cn('mb-2 text-current', iconWidth, iconHeight)} strokeWidth={1.5} />
        ))}
      <div className="w-full h-px overflow-hidden flex items-start bg-border-muted">
        <span className={cn('h-full bg-foreground-lighter', iconWidth)} />
      </div>
      <h4 className="text-foreground text-lg lg:text-xl mt-1">{feature.heading}</h4>
      <p className="text-foreground-lighter text-sm">{feature.subheading}</p>
      {/* <TextLink hasChevron label="Read story" url={feature.url} className="mt-4" /> */}
    </li>
  )
}

export default FeaturesSection
