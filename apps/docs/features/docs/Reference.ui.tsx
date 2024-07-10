import { type PropsWithChildren } from 'react'

import { cn } from 'ui'

type SectionProps = PropsWithChildren & {
  id: string
  columns?: 'single' | 'double'
}

function Section({ id, columns = 'single', children }: SectionProps) {
  const singleColumn = columns === 'single'

  return (
    <section>
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

function EducationSection({ children, ...props }: PropsWithChildren) {
  return <section className={'prose max-w-none'}>{children}</section>
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
