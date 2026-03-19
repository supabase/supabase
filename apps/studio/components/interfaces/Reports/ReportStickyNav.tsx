import { PropsWithChildren } from 'react'
import { cn } from 'ui'

const ReportStickyNav = ({
  content,
  children,
  className,
}: PropsWithChildren<{ className?: string; content: React.ReactNode }>) => {
  return (
    <section className={cn('relative flex flex-col gap-4 pt-16 -mt-2', className)}>
      <div className="absolute inset-0 z-40 pointer-events-none flex flex-col gap-4">
        <div className="sticky top-0 py-4 mb-4 flex items-center gap-2 pointer-events-auto dark:bg-background-200 bg-background">
          {content}
        </div>
      </div>
      {children}
    </section>
  )
}
export default ReportStickyNav
