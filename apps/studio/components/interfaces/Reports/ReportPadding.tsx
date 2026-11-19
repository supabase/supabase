import { PropsWithChildren } from 'react'
import { cn } from 'ui'

/**
 * Standardized padding and width layout for non-custom reports
 */
export const ReportPadding = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => {
  return (
    <div
      className={cn(
        'flex flex-col grow gap-4 px-(--report-padding-x) py-6 mx-auto w-full [--report-padding-x:1.25rem] lg:[--report-padding-x:4rem] 1xl:[--report-padding-x:7rem] 2xl:[--report-padding-x:8rem] @lg:[--report-padding-x:1.5rem] @xl:[--report-padding-x:5.5rem]',
        className
      )}
    >
      {children}
    </div>
  )
}
