import type { ReactNode } from 'react'
import { cn } from 'ui'

import SectionContainer from '../Layouts/SectionContainer'

interface Props {
  breadcrumb?: ReactNode
  title?: string
  h1: ReactNode
  subheader?: ReactNode
  className?: string
}

const PageHeader = ({ breadcrumb, title, h1, subheader, className }: Props) => (
  <div className={cn('w-full border-b bg-alternative py-8 lg:py-12', className)}>
    <SectionContainer className="py-0!">
      {breadcrumb && <div className="mb-6">{breadcrumb}</div>}
      {title && (
        <p className="mb-3 font-mono text-sm uppercase tracking-widest text-brand">{title}</p>
      )}
      <h1 className="h1 font-normal tracking-tight text-foreground md:text-3xl lg:text-4xl">
        {h1}
      </h1>
      {subheader && (
        <p className="mt-3 max-w-2xl text-base text-foreground-light lg:text-lg">{subheader}</p>
      )}
    </SectionContainer>
  </div>
)

export default PageHeader
