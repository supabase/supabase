import { PropsWithChildren } from 'react'
import { cn } from 'ui'

interface ConnectSheetStepProps {
  number: number
  title: string
  description: string
  className?: string
}

export const ConnectSheetStep = ({
  number,
  title,
  description,
  className,
  children,
}: PropsWithChildren<ConnectSheetStepProps>) => {
  return (
    <div
      className={cn('group', className)}
      data-connect-step
      data-step-title={title}
      data-step-description={description}
    >
      <div className="flex items-start gap-6 self-stretch">
        <div className="relative self-stretch shrink-0 w-6">
          <div className="absolute inset-0 flex items-start justify-center">
            <div
              aria-hidden="true"
              className={cn(
                'absolute left-[calc(50%-1px)] w-px bg-border opacity-60 h-full',
                'group-last:bg-transparent'
              )}
            />
            <div className="relative z-10 flex font-mono text-xs items-center justify-center min-w-6 w-6 h-6 border border-default rounded-md bg-surface-100 text-foreground-light">
              {number}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-5 gap-x-6 gap-y-4 pb-12 w-full">
          <div className="flex flex-col 2xl:col-span-2">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-sm text-foreground-light">{description}</p>
          </div>
          <div className="2xl:col-span-3 [&_pre.code-block]:!bg-surface-75" data-step-content>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
