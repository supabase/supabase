import React from 'react'
import { cn, Image } from 'ui'
import Panel from '~/components/Panel'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { LucideIcon } from 'lucide-react'

interface Feature {
  id: string
  title: string
  description: React.ReactNode
  icon?: LucideIcon
  image: {
    dark: string
    light: string
  }
  className?: string
  imageClassName?: string
  layout?: string
}

interface Props {
  id: string
  title: string
  subheading: string
  features: Feature[]
  className?: string
}

const PlatformSection = ({ id, title, subheading, features, className }: Props) => {
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
    <div className={cn('bg-transparent text-foreground-lighter', feature.className)}>
      <div className="p-6 flex flex-col gap-3 h-[150px]">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" strokeWidth={1.5} />}
          <h3 className="text-sm">{feature.title}</h3>
        </div>
        <p className="text-base">{feature.description}</p>
      </div>

      <div className={cn('relative overflow-hidden w-full', feature.imageClassName)}>
        {feature.layout === 'table' && (
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.2)] z-10"></div>
            <Image
              src={feature.image}
              alt={feature.title}
              layout="fill"
              objectFit="cover"
              className="object-top"
            />
          </div>
        )}

        {feature.layout === 'auth' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-surface-100 to-transparent z-10 opacity-60"></div>
            <Image
              src={feature.image}
              alt={feature.title}
              layout="fill"
              objectFit="contain"
              className="object-center scale-90 p-4"
            />
            <div className="absolute bottom-0 w-full flex justify-center pb-8">
              <div className="flex space-x-1">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-foreground-light opacity-30" />
                ))}
              </div>
            </div>
          </div>
        )}

        {feature.layout === 'policies' && (
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-100 z-10 opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-2/3 h-2/3">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M80,50 L120,50 L150,100 L120,150 L80,150 L50,100 Z"
                  stroke="rgba(62, 207, 142, 0.3)"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M80,70 L120,70 L140,100 L120,130 L80,130 L60,100 Z"
                  stroke="rgba(62, 207, 142, 0.5)"
                  strokeWidth="1"
                  fill="rgba(0, 41, 24, 0.3)"
                />
              </svg>
            </div>
            <Image
              src={feature.image}
              alt={feature.title}
              layout="fill"
              objectFit="cover"
              className="object-top"
            />
          </div>
        )}

        {feature.layout === 'realtime' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute w-40 h-40 rounded-full bg-brand opacity-10 filter blur-3xl"></div>
            <svg viewBox="0 0 200 200" className="w-2/3 h-2/3 opacity-40">
              <circle
                cx="100"
                cy="100"
                r="70"
                stroke="#4D4D4D"
                strokeWidth="2.5"
                strokeDasharray="1 15"
                fill="none"
              />
              <circle cx="100" cy="100" r="50" stroke="#3ECF8E" strokeWidth="1.2" fill="none" />
              <g>
                <circle
                  cx="100"
                  cy="100"
                  r="20"
                  fill="#002918"
                  stroke="#3ECF8E"
                  strokeWidth="1.2"
                />
                <circle cx="94" cy="94" r="2" fill="#3ECF8E" />
                <circle cx="100" cy="94" r="2" fill="#3ECF8E" />
                <circle cx="106" cy="94" r="2" fill="#3ECF8E" />
              </g>
            </svg>
          </div>
        )}

        {feature.layout === 'storage' && (
          <div className="relative w-full h-full bg-transparent flex items-center justify-center">
            <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-surface-100 to-transparent z-10 opacity-50"></div>
            <Image
              src={feature.image}
              alt={feature.title}
              layout="fill"
              objectFit="contain"
              className="object-center p-4"
            />
          </div>
        )}

        {feature.layout === 'functions' && (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-100 z-10 opacity-50"></div>
            <div className="absolute w-full h-full">
              <svg className="w-full h-full opacity-10" viewBox="0 0 240 240">
                <path
                  d="M120,40 L60,100 L120,160 L180,100 Z"
                  stroke="#FAFAFA"
                  strokeWidth="0.5"
                  strokeOpacity="0.6"
                  fill="none"
                />
                <path
                  d="M120,60 L80,100 L120,140 L160,100 Z"
                  stroke="#FAFAFA"
                  strokeWidth="0.5"
                  strokeOpacity="0.6"
                  fill="none"
                />
                <circle cx="120" cy="40" r="3" fill="#FAFAFA" fillOpacity="0.6" />
                <circle cx="60" cy="100" r="3" fill="#FAFAFA" fillOpacity="0.6" />
                <circle cx="120" cy="160" r="3" fill="#FAFAFA" fillOpacity="0.6" />
                <circle cx="180" cy="100" r="3" fill="#FAFAFA" fillOpacity="0.6" />
              </svg>
            </div>
            <div className="relative z-20 bg-surface-200 border border-default rounded-md px-4 py-1 font-mono text-xs">
              $ deno run
            </div>
          </div>
        )}

        {feature.layout === 'vectors' && (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-100 z-10 opacity-50"></div>
            <div className="absolute w-full h-full flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-3/4 h-3/4 text-foreground-light opacity-20">
                <g>
                  <circle cx="70" cy="70" r="2" fill="currentColor" />
                  <circle cx="100" cy="60" r="1.5" fill="currentColor" />
                  <circle cx="130" cy="80" r="2.5" fill="currentColor" />
                  <circle cx="90" cy="100" r="2" fill="currentColor" />
                  <circle cx="120" cy="110" r="1.8" fill="currentColor" />
                  <circle cx="60" cy="110" r="1.2" fill="currentColor" />
                  <circle cx="80" cy="130" r="2.2" fill="currentColor" />
                  <circle cx="110" cy="140" r="1.5" fill="currentColor" />
                  <circle cx="140" cy="130" r="2" fill="currentColor" />
                  <circle cx="150" cy="100" r="1.7" fill="currentColor" />
                  <circle cx="140" cy="60" r="1.3" fill="currentColor" />
                  <circle cx="170" cy="80" r="1.9" fill="currentColor" />
                  <line x1="70" y1="70" x2="100" y2="60" stroke="currentColor" strokeWidth="0.3" />
                  <line x1="100" y1="60" x2="130" y2="80" stroke="currentColor" strokeWidth="0.3" />
                  <line x1="130" y1="80" x2="90" y2="100" stroke="currentColor" strokeWidth="0.3" />
                  <line
                    x1="90"
                    y1="100"
                    x2="120"
                    y2="110"
                    stroke="currentColor"
                    strokeWidth="0.3"
                  />
                  <line x1="90" y1="100" x2="60" y2="110" stroke="currentColor" strokeWidth="0.3" />
                  <line x1="60" y1="110" x2="80" y2="130" stroke="currentColor" strokeWidth="0.3" />
                  <line
                    x1="80"
                    y1="130"
                    x2="110"
                    y2="140"
                    stroke="currentColor"
                    strokeWidth="0.3"
                  />
                  <line
                    x1="110"
                    y1="140"
                    x2="140"
                    y2="130"
                    stroke="currentColor"
                    strokeWidth="0.3"
                  />
                  <line
                    x1="140"
                    y1="130"
                    x2="150"
                    y2="100"
                    stroke="currentColor"
                    strokeWidth="0.3"
                  />
                  <line
                    x1="150"
                    y1="100"
                    x2="140"
                    y2="60"
                    stroke="currentColor"
                    strokeWidth="0.3"
                  />
                  <line x1="140" y1="60" x2="170" y2="80" stroke="currentColor" strokeWidth="0.3" />
                  <line
                    x1="170"
                    y1="80"
                    x2="150"
                    y2="100"
                    stroke="currentColor"
                    strokeWidth="0.3"
                  />
                </g>
              </svg>
            </div>
          </div>
        )}

        {feature.layout === 'rls' && (
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-100 z-10 opacity-50"></div>
            <div className="absolute bottom-10 inset-x-0 z-20 px-4">
              <div className="w-full h-10 bg-surface-200 border border-default rounded-md flex items-center px-3">
                <div className="h-2 w-1/4 bg-brand rounded-full opacity-50"></div>
              </div>
            </div>
            <Image
              src={feature.image}
              alt={feature.title}
              layout="fill"
              objectFit="cover"
              className="object-top"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default PlatformSection
