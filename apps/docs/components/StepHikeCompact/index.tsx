import { FC, PropsWithChildren } from 'react'
import { cn } from 'ui'

interface IStep {
  title: string
  step: number | string
}

interface IStepHikeCompactSubcomponents {
  Step: FC<IStep>
  Details: FC<IDetails>
  Code: FC<ICode>
}
interface IDetails {
  title?: string
  fullWidth?: boolean
}

interface ICode {}

interface IStepHikeCompact {
  title: string
}

const StepHikeCompact: FC<PropsWithChildren<IStepHikeCompact>> & IStepHikeCompactSubcomponents = ({
  children,
  title,
}) => {
  return <div className="py-8">{children}</div>
}

const Step: FC<PropsWithChildren<IStep>> = ({ children, title, step }) => {
  return (
    <div className="relative pb-8 group">
      <div
        className="
          absolute
          w-px
          left-[11px]
          pt-1
          h-full
        "
      >
        <div
          className="
          absolute
          w-full
          h-full
          py-1
          bg-border-control
          group-last:bg-transparent
        "
        ></div>
      </div>
      <div
        className="
          absolute
          left-0
          flex gap-3 items-center
          not-prose
              "
      >
        <div className="flex items-center gap-6">
          <div
            className="border bg-surface-100
          border-control flex items-center justify-center rounded-full
          w-6 h-6 text-xs text-foreground font-normal font-mono
          dropshadow-sm
          "
          >
            {step}
          </div>
        </div>
      </div>
      <div
        className={cn(
          'ml-12 flex min-w-0 flex-col',
          '[&_[data-step-hike=details]+[data-step-hike=code]]:mt-6',
          '[&_[data-step-hike=details]:not(:has(+[data-step-hike=code]))]:mb-6',
          '[&_[data-step-hike=code]]:mb-6',
          '[&_[data-step-hike=code]:last-child]:mb-0'
        )}
      >
        {children}
      </div>
    </div>
  )
}

const Details: FC<PropsWithChildren<IDetails>> = ({ children, title, fullWidth = false }) => {
  return (
    <div
      data-step-hike="details"
      className={cn(
        'min-w-0',
        '[&_p:last-child]:mb-0 [&_ul:last-child]:mb-0 [&_ol:last-child]:mb-0',
        fullWidth && 'w-full'
      )}
    >
      {title && (
        <span className="block mt-0 mb-[18px] text-foreground text-base font-heading font-semibold">
          {title}
        </span>
      )}
      {children}
    </div>
  )
}

const Code: FC<PropsWithChildren<ICode>> = ({ children }) => {
  // Not `not-prose`: steps interleave labels and admonitions with their code samples, and
  // stripping prose leaves that text unstyled and flush against the samples.
  return (
    <div
      data-step-hike="code"
      className={cn(
        'min-w-0 w-full',
        // `Step` spaces the block as a whole, so samples don't carry margins of their own...
        '[&_.shiki]:!my-0 [&_.shiki-wrapper]:!my-0',
        // ...but back-to-back samples have no prose between them to separate them.
        '[&_.shiki+.shiki]:!mt-6'
      )}
    >
      {children}
    </div>
  )
}

StepHikeCompact.Step = Step
StepHikeCompact.Details = Details
StepHikeCompact.Code = Code
export default StepHikeCompact
