import { PropsWithChildren } from 'react'
import { cn } from 'ui'

const ReportStickyNav = ({
  content,
  children,
  className,
}: PropsWithChildren<{ className?: string; content: React.ReactNode }>) => {
  return (
    <section className={cn('relative flex flex-col gap-4 -mt-2', className)}>
      <div className="sticky top-0 z-40 py-4 flex w-full items-center gap-2 bg-background">
        {content}
      </div>
      {children}
    </section>
  )
}
export default ReportStickyNav
