import React from 'react'
import { cn } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'

interface Feature {
  id?: string
  title: string
  subheading: string | React.ReactNode
  highlights?: string | React.ReactNode
  url?: string
  icon?: string | React.ReactNode
  image?: any
  className?: string
  onClick?: any
  alignLeft?: boolean
  isDatabase?: boolean
}

export interface PlatformSectionProps {
  id?: string
  title: string | React.ReactNode
  subheading: string
  features?: Feature[]
  className?: string
}

const PlatformSection = ({ title, subheading, features, id, className }: PlatformSectionProps) => {
  return (
    <SectionContainer id={id} className={cn('flex flex-col gap-12 py-16 md:py-24', className)}>
      <div className="flex flex-col gap-4 max-w-lg">
        <h2 className="text-2xl md:text-3xl text-foreground-lighter font-normal">{title}</h2>
        <p className="text-foreground-lighter text-base md:text-lg">{subheading}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 sm:divide-x divide-y rounded-md border border-default overflow-hidden">
        {features?.map((feature) => <FeatureCard key={feature.id} feature={feature} />)}
      </div>
    </SectionContainer>
  )
}

const FeatureCard = ({ feature }: { feature: Feature }) => {
  const { alignLeft = true } = feature

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        'flex-1 flex flex-col',
        'items-start sm:items-center lg:items-start justify-between',
        'bg-default w-full h-full min-h-[350px] sm:min-h-[400px]',
        'text-foreground-lighter [&_strong]:!font-normal [&_strong]:!text-foreground',
        feature.className
      )}
    >
      <div
        className={cn(
          'relative z-10',
          'p-4 sm:p-6 2xl:p-8',
          'w-full',
          'mx-auto gap-2 sm:gap-4',
          'flex flex-col items-start sm:items-center',
          'text-left sm:text-center',
          feature.isDatabase && 'lg:h-full',
          alignLeft && !feature.isDatabase && 'lg:mx-0 lg:items-start lg:text-left',
          alignLeft &&
            feature.isDatabase &&
            'ml-0 md:justify-start md:text-left md:items-start lg:max-w-[47%]'
        )}
      >
        <div className="flex items-center gap-2">
          {feature.icon &&
            (typeof feature.icon === 'string' ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 25 25"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d={feature.icon}
                  stroke="currentColor"
                  strokeMiterlimit="10"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
              </svg>
            ) : (
              feature.icon
            ))}
          <h3 className="">{feature.title}</h3>
        </div>
        <div className="flex-1 flex flex-col justify-between gap-2">
          <p className="text-sm 2xl:text-base [&_strong]:!text-foreground">{feature.subheading}</p>
          {feature.highlights && (
            <span
              className={cn('hidden lg:block text-foreground', feature.isDatabase && 'md:block')}
            >
              {feature.highlights}
            </span>
          )}
        </div>
      </div>
      {feature.image && feature.image}
    </div>
  )
}

export default PlatformSection
