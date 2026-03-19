import React from 'react'
import { cn } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'

interface Feature {
  id: string
  title: string
  description: string | React.ReactNode
  icon: string
  iconNoStroke?: boolean
  className?: string
}

export interface FeatureGridProps {
  id: string
  features: Feature[]
  className?: string
}

const FeatureGrid = ({ id, features, className }: FeatureGridProps) => {
  return (
    <SectionContainer id={id} className={cn('flex flex-col gap-12 py-16 md:py-24', className)}>
      <div
        className="
          grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
          sm:divide-x divide-y border border-default rounded-md overflow-hidden
          [&>div:nth-child(2n+1)]:sm:!border-l-0
          [&>div:nth-child(2)]:sm:!border-t-0
          [&>div:nth-child(3)]:lg:!border-t-0
          [&>div:nth-child(3n)]:lg:!border-l
          [&>div:nth-child(4n)]:lg:!border-l-0
          [&>div:nth-child(3n-1)]:lg:!border-l
        "
      >
        {features.map((feature) => (
          <div
            key={feature.id}
            className={cn(
              'text-sm bg-default p-4 md:p-6 flex flex-col gap-2 md:gap-4 text-foreground-lighter',
              feature.className
            )}
          >
            <div className="flex items-center gap-2">
              {feature.icon && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 25 25"
                  fill={feature.iconNoStroke ? 'currentColor' : 'none'}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d={feature.icon}
                    stroke={feature.iconNoStroke ? 'none' : 'currentColor'}
                    strokeMiterlimit="10"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="1.5"
                  />
                </svg>
              )}
              <h3 className="">{feature.title}</h3>
            </div>
            <p className="text-base">{feature.description}</p>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}

export default FeatureGrid
