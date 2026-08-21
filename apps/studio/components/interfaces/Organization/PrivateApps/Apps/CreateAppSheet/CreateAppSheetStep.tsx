import { PropsWithChildren } from 'react'

interface StepProps {
  number: number
  title: string
  description: string
  isLast?: boolean
  disabled?: boolean
}

export function CreateAppSheetStep({
  number,
  title,
  description,
  isLast = false,
  disabled = false,
  children,
}: PropsWithChildren<StepProps>) {
  return (
    <div
      className={`flex items-start gap-6 self-stretch transition-opacity ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
    >
      <div className="relative self-stretch shrink-0 w-6">
        <div className="absolute inset-0 flex items-start justify-center">
          {!isLast && (
            <div
              aria-hidden
              className="absolute left-[calc(50%-1px)] w-px bg-border opacity-60 h-full"
            />
          )}
          <div className="relative z-10 flex font-mono text-xs items-center justify-center min-w-6 w-6 h-6 border border-default rounded-md bg-surface-100 text-foreground-light">
            {number}
          </div>
        </div>
      </div>
      <div className={`w-full ${isLast ? '' : 'pb-10'}`}>
        <p className="text-sm font-medium text-foreground mb-1">{title}</p>
        <p className="text-sm text-foreground-light mb-4">{description}</p>
        {children}
      </div>
    </div>
  )
}
