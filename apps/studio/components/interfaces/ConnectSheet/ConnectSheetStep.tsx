import { type ReactNode } from 'react'
import { cn } from 'ui'

interface ConnectSheetStepProps {
  number: number
  title: string
  description: string
  children: ReactNode
  className?: string
  isFirst?: boolean
  isLast?: boolean
}

export const ConnectSheetStep = ({
  number,
  title,
  description,
  children,
  className,
  isFirst = false,
  isLast = false,
}: ConnectSheetStepProps) => {
  const lineTopClass = isFirst ? 'top-1/2' : '-top-6'
  const lineBottomClass = isLast ? 'bottom-1/2' : '-bottom-6'

  return (
    <div
      className={cn('py-6', className)}
      data-connect-step
      data-step-title={title}
      data-step-description={description}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-start">
        {/* Left column: number, title, description */}
        <div className="flex items-start gap-6 self-stretch">
          <div className="relative self-stretch shrink-0 w-6">
            <div className="absolute inset-0 flex items-start justify-center">
              <div
                aria-hidden="true"
                className={cn(
                  'absolute left-[calc(50%-1px)] w-px bg-border opacity-60',
                  lineTopClass,
                  lineBottomClass
                )}
              />
              <div className="relative z-10 flex font-mono text-xs items-center justify-center min-w-6 w-6 h-6 border border-default rounded-md bg-surface-100 text-foreground-light">
                {number}
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-sm text-foreground-light">{description}</p>
          </div>
        </div>

        {/* Right column: content */}
        <div className="lg:pl-0 [&_pre.code-block]:!bg-surface-75" data-step-content>
          {children}
        </div>
      </div>
    </div>
  )
}
