import React from 'react'
import { cn } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'

interface Feature {
  id: string
  title: string
  description: string
}

interface Props {
  id: string
  title: string
  subheading: string
  features: Feature[]
  className?: string
}

const FeatureGrid = ({ id, title, subheading, features, className }: Props) => {
  return (
    <SectionContainer id={id} className={cn('flex flex-col gap-12 py-16 md:py-24', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-x divide-y border border-default">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="text-sm bg-default p-6 flex flex-col gap-4 text-foreground-lighter"
          >
            <h3 className="">{feature.title}</h3>
            <p className="text-base">{feature.description}</p>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}

export default FeatureGrid
