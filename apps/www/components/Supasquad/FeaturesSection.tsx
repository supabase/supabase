import React, { FC } from 'react'
import dynamic from 'next/dynamic'
import { cn } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import type {
  Feature,
  FeaturesSection as FeaturesSectionType,
} from '~/data/open-source/contributing/supasquad.utils'

const FeatureIcon = dynamic(() => import('~/components/Supasquad/FeatureIcon'), { ssr: false })

const FeaturesSection = (props: FeaturesSectionType) => {
  return (
    <SectionContainer id={props.id} className={cn('flex flex-col gap-4 md:gap-8', props.className)}>
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
          <FeatureItem feature={feature} key={feature.id} />
        ))}
      </ul>
    </SectionContainer>
  )
}

interface FeatureItemProps {
  feature: Feature
}

const FeatureItem: FC<FeatureItemProps> = ({ feature }) => {
  return (
    <li className="flex flex-col gap-2 text-sm text-foreground-lighter">
      <FeatureIcon icon={feature.icon} iconNoStroke={feature.iconNoStroke} />
      <div className="w-full h-px overflow-hidden flex items-start bg-border-muted">
        <span className={cn('h-full bg-foreground-lighter', 'h-7')} />
      </div>
      <h4 className="text-foreground text-lg lg:text-xl mt-1">{feature.heading}</h4>
      <p className="text-foreground-lighter text-sm">{feature.subheading}</p>
      {/* <TextLink hasChevron label="Read story" url={feature.url} className="mt-4" /> */}
    </li>
  )
}

export default FeaturesSection
