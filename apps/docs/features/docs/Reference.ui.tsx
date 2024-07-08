import { type PropsWithChildren } from 'react'

import { cn } from 'ui'
import { StickyHeader, type StickyHeaderProps } from './Reference.ui.client'

type SectionProps = PropsWithChildren & {
  id: string
  columns?: 'single' | 'double'
} & StickyHeaderProps

function Section({ id, columns = 'single', children, ...props }: SectionProps) {
  const singleColumn = columns === 'single'

  return (
    <section>
      <StickyHeader {...props} />
      <div className={cn('grid', singleColumn ? 'lg:max-w-3xl' : 'lg:grid-cols-2')}>{children}</div>
    </section>
  )
}

function Details({ children }: PropsWithChildren) {
  /*
   * `min-w` is necessary because these are used as grid children, which have
   * default `min-w-auto`
   */
  return <div className="w-full min-w-full">{children}</div>
}

function Examples({ children }: PropsWithChildren) {
  /*
   * `min-w` is necessary because these are used as grid children, which have
   * default `min-w-auto`
   */
  return <div className="w-full min-w-full sticky top-32">{children}</div>
}

type EducationSectionProps = PropsWithChildren & { hideTitle?: boolean } & StickyHeaderProps

function EducationSection({ hideTitle = false, children, ...props }: EducationSectionProps) {
  return (
    <section className={'prose max-w-none'}>
      {!hideTitle && <StickyHeader {...props} />}
      {children}
    </section>
  )
}

interface EducationRowProps extends PropsWithChildren {
  className?: string
}

function EducationRow({ className, children }: EducationRowProps) {
  return <div className={cn('grid lg:grid-cols-2 gap-8 lg:gap-16', className)}>{children}</div>
}

const RefSubLayout = {
  Section,
  EducationSection,
  EducationRow,
  Details,
  Examples,
}

export { RefSubLayout }
