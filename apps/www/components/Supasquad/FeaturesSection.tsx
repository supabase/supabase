import React, { FC } from 'react'

import { cn } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import type {
  Feature,
  FeaturesSection as FeaturesSectionType,
} from '~/data/open-source/contributing/supasquad.utils'
import {
  Award,
  Zap,
  MessageSquare,
  DollarSign,
  Gift,
  TrendingUp,
  Heart,
  LifeBuoy,
  Wrench,
  Shield,
} from 'lucide-react'

const ICONS = {
  award: Award,
  zap: Zap,
  'message-square': MessageSquare,
  'dollar-sign': DollarSign,
  gift: Gift,
  'trending-up': TrendingUp,
  heart: Heart,
  'life-buoy': LifeBuoy,
  wrench: Wrench,
  shield: Shield,
} as const

type IconName = keyof typeof ICONS

// Type guard to check if a string is a valid icon name
function isValidIconName(icon: string): icon is IconName {
  return icon in ICONS
}

export function IconComponent({ icon, className }: { icon: IconName; className?: string }) {
  const Cmp = ICONS[icon]
  if (!Cmp) {
    console.warn(`Icon "${icon}" not found in ICONS object`)
    return null
  }
  return <Cmp className={className} aria-hidden focusable={false} />
}

const FeaturesSection = (props: FeaturesSectionType) => {
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
  console.log(feature.icon)

  return (
    <li className="flex flex-col gap-2 text-sm text-foreground-lighter">
      {feature.icon && isValidIconName(feature.icon) ? (
        <IconComponent icon={feature.icon} className="w-7 h-7 mb-2 text-current" />
      ) : null}
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
