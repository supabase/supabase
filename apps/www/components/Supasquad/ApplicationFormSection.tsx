import React from 'react'
import { cn } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import ApplyToSupaSquadForm from '~/components/Forms/ApplyToSupaSquadForm'

interface Props {
  id: string
  title: string | React.ReactNode
  subtitle?: string
  cta: {
    label: string
    icon?: React.ReactNode
  }
  image?: {
    dark: string
    light: string
  }
  className?: string
}

const ApplicationFormSection = ({ id, title, subtitle, cta, className }: Props) => {
  return (
    <SectionContainer
      id={id}
      className={cn('py-16 md:py-24 lg:py-32 relative overflow-hidden', className)}
    >
      <div className="mx-auto relative z-10">
        <div className="flex flex-col gap-6 text-center items-center max-w-5xl mx-auto">
          <h2 className="text-foreground-light text-2xl lg:text-3xl leading-tight">{title}</h2>
          {subtitle && <p className="text-foreground-light text-lg">{subtitle}</p>}
          <ApplyToSupaSquadForm />
        </div>
      </div>

      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-transparent to-background opacity-80 z-0"></div>
    </SectionContainer>
  )
}

export default ApplicationFormSection
