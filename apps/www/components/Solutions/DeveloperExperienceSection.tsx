import React from 'react'
import { cn, Image } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { Badge } from 'ui'
import { Check, X } from 'lucide-react'

interface Feature {
  id?: string
  title: string | React.ReactNode
  subheading: string | React.ReactNode
  highlights?: string | React.ReactNode
  url?: string
  icon?: string
  image?: any
  className?: string
  onClick?: any
  alignLeft?: boolean
}

export interface DXSectionProps {
  id: string
  title: string | React.ReactNode
  subheading: string
  features: Feature[]
  className?: string
}

const DeveloperExperienceSection = ({
  id,
  title,
  subheading,
  features,
  className,
}: DXSectionProps) => {
  return (
    <SectionContainer id={id} className={cn('flex flex-col gap-12 py-16 md:py-24', className)}>
      <div className="flex flex-col gap-4 max-w-lg">
        <h2 className="text-2xl md:text-3xl font-normal text-foreground-lighter">{title}</h2>
        <p className="text-foreground-light text-base md:text-lg">{subheading}</p>
      </div>

      <div
        className="
          grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0
          rounded-md border-default overflow-hidden
          sm:divide-x divide-y border
          [&>div:nth-child(2n+1)]:sm:!border-l-0
          [&>div:nth-child(2)]:sm:!border-t-0
          [&>div:nth-child(3)]:lg:!border-t-0
          [&>div:nth-child(3n)]:lg:!border-l
          [&>div:nth-child(4n)]:lg:!border-l-0
          [&>div:nth-child(3n-1)]:lg:!border-l
        "
      >
        {features.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
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
        'items-start justify-between',
        'bg-default w-full h-full min-h-[330px] sm:min-h-[360px]',
        'text-foreground-lighter [&_strong]:!font-normal [&_strong]:!text-foreground',
        feature.className
      )}
    >
      <div
        className={cn(
          'relative z-10',
          'p-4 md:p-6 2xl:p-8',
          'w-full',
          'mx-auto gap-2 sm:gap-4',
          'flex flex-col items-start',
          'text-left',
          alignLeft && 'lg:mx-0 lg:items-start lg:text-left'
        )}
      >
        <div className="flex items-center gap-2">
          {feature.icon && (
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
          )}
          <h3 className="">{feature.title}</h3>
        </div>
        <div className="flex-1 flex flex-col justify-between gap-2">
          <p className="text-sm [&_strong]:!text-foreground">{feature.subheading}</p>
          {feature.highlights && (
            <span className="hidden lg:block text-foreground">{feature.highlights}</span>
          )}
        </div>
      </div>
      {feature.image && feature.image}
    </div>
  )
}

export default DeveloperExperienceSection
