import { PropsWithChildren } from 'react'
import { cn } from 'ui'

interface ConnectSheetStepProps {
  number: number
  title: string
  description: string
  optional?: boolean
  className?: string
}

export const ConnectSheetStep = ({
  number,
  title,
  description,
  optional = false,
  className,
  children,
}: PropsWithChildren<ConnectSheetStepProps>) => {
  const displayTitle = optional ? `${title} (optional)` : title

  return (
    <div
      className={cn('group', className)}
      data-connect-step
      data-step-title={displayTitle}
      data-step-description={description}
    >
      <div className="flex items-start gap-5 self-stretch">
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

        {/* Container query: side-by-side title | content when the step row is wide enough.
            Viewport 2xl never applied inside max-w-4xl sheets. */}
        <div className="@container w-full min-w-0">
          <div className="grid grid-cols-1 @[36rem]:grid-cols-5 gap-x-6 gap-y-3 pb-8 w-full">
            <div className="flex flex-col @[36rem]:col-span-2 gap-y-0.5">
              <p className="text-sm font-medium text-foreground">
                {title}
                {optional && <span className="font-normal text-foreground-muted"> (optional)</span>}
              </p>
              <p className="text-sm text-foreground-light">{description}</p>
            </div>
            <div
              className="@[36rem]:col-span-3 [&_pre.code-block]:bg-surface-75!"
              data-step-content
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
