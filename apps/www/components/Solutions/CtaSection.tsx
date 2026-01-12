import Link from 'next/link'
import React from 'react'
import { Button, cn, Image } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'

interface Props {
  id: string
  title: string | React.ReactNode
  subtitle?: string
  primaryCta: {
    label: string
    url: string
    target?: string
    icon?: React.ReactNode
  }
  secondaryCta?: {
    label: string
    url: string
  }
  image?: {
    dark: string
    light: string
  }
  className?: string
}

const CtaSection = ({ id, title, subtitle, primaryCta, secondaryCta, className }: Props) => {
  return (
    <SectionContainer
      id={id}
      className={cn('py-16 md:py-24 lg:py-32 relative overflow-hidden', className)}
    >
      <div className="mx-auto relative z-10">
        <div className="flex flex-col gap-6 text-center items-center max-w-5xl mx-auto">
          <h2 className="text-foreground-light text-2xl lg:text-3xl leading-tight">{title}</h2>
          {subtitle && <p className="text-foreground-light text-lg">{subtitle}</p>}
          <div className="flex flex-wrap gap-3 pt-4">
            <Button asChild size="medium" icon={primaryCta.icon}>
              <Link href={primaryCta.url} target={primaryCta.target}>
                {primaryCta.label}
              </Link>
            </Button>
            {secondaryCta && (
              <Button asChild size="medium" type="default">
                <Link href={secondaryCta.url}>{secondaryCta.label}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-transparent to-background opacity-80 z-0"></div>
    </SectionContainer>
  )
}

export default CtaSection
