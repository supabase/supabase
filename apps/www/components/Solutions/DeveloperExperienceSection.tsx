import React from 'react'
import { cn, Image } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { Badge } from 'ui'
import { Check, X } from 'lucide-react'

interface Feature {
  id: string
  title: string
  description: string
  icon: React.ElementType
  supabaseFeature: boolean
  neonFeature: boolean
  image: {
    dark: string
    light: string
  }
}

interface Props {
  id: string
  title: string
  subheading: string
  features: Feature[]
  className?: string
}

const DeveloperExperienceSection = ({ id, title, subheading, features, className }: Props) => {
  return (
    <SectionContainer id={id} className={cn('flex flex-col gap-12 py-16 md:py-24', className)}>
      <div className="flex flex-col gap-4 max-w-lg">
        <h2 className="text-2xl md:text-3xl font-normal text-foreground">{title}</h2>
        <p className="text-foreground-light text-base md:text-lg">{subheading}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y border border-default overflow-hidden">
        {features.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </div>
    </SectionContainer>
  )
}

const FeatureCard = ({ feature }: { feature: Feature }) => {
  const Icon = feature.icon

  return (
    <div className="bg-transparent text-foreground-lighter">
      <div className="p-6 flex flex-col gap-3 h-auto">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" strokeWidth={1.5} />}
          <h3 className="text-sm">{feature.title}</h3>
        </div>
        <p className="text-base">{feature.description}</p>
      </div>

      <div className="relative overflow-hidden w-full h-48">
        <Image
          src={feature.image}
          alt={feature.title}
          layout="fill"
          objectFit="cover"
          className="object-top"
        />
      </div>
    </div>
  )
}

export default DeveloperExperienceSection
