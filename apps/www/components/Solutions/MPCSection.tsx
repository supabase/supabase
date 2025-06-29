import React from 'react'
import Link from 'next/link'

import SectionContainer from '../Layouts/SectionContainer'
import APISection, { type APIExample } from '../Sections/APISection'
import { cn } from 'ui'
import { useBreakpoint } from 'common'

import type { FrameworkLinkProps } from 'data/solutions/solutions.utils'

export interface MPCSectionProps {
  id: string
  heading: string | React.ReactNode
  subheading?: string
  documentationLink: string
  ctaLabel?: string
  frameworks: FrameworkLinkProps[]
  apiExamples: APIExample[]
}

const MPCSection = ({
  id,
  heading,
  subheading,
  ctaLabel,
  documentationLink,
  frameworks,
  apiExamples,
}: MPCSectionProps) => {
  return (
    <SectionContainer id={id} className="">
      <APISection
        content={apiExamples}
        title={heading}
        text={[<p key={0}>{subheading}</p>]}
        footer={[
          <div key={'frmwks'} className="grid grid-cols-5 md:grid-cols-6">
            {frameworks?.map((framework) => (
              <FrameworkLink key={framework.name} framework={framework} />
            ))}
          </div>,
        ]}
        documentation_link={documentationLink}
        ctaLabel={ctaLabel}
      />
    </SectionContainer>
  )
}

const FrameworkLink = ({
  framework,
  className,
}: {
  framework: FrameworkLinkProps
  className?: string
}) => {
  const isXs = useBreakpoint(640)

  return (
    <Link
      href={framework.docs}
      className={cn(
        'group relative p-4 transition-colors duration-200',
        'hover:bg-surface-100 -m-px rounded-lg',
        'flex flex-col items-center gap-2 text-center aspect-square justify-center',
        className
      )}
    >
      <div className="text-foreground-lighter group-hover:text-foreground transition-colors">
        {typeof framework.icon === 'string' ? (
          <svg
            width={isXs ? 35 : 45}
            height={isXs ? 35 : 45}
            fillRule="evenodd"
            clipRule="evenodd"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d={framework.icon} fill="currentColor" />
          </svg>
        ) : (
          framework.icon
        )}
      </div>
      <span className="sr-only text-sm font-medium text-foreground-light group-hover:text-foreground transition-colors">
        {framework.name}
      </span>
    </Link>
  )
}

export default MPCSection
