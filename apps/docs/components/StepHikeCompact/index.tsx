//import { Step } from 'next-seo/lib/types'
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
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-10 lg:ml-12">{children}</div>
    </div>
  )
}

const Details: FC<PropsWithChildren<IDetails>> = ({ children, title, fullWidth = false }) => {
  return (
    <div className={cn(fullWidth ? 'col-span-12' : 'col-span-5', 'ml-12', 'lg:ml-0')}>
      <h3 className="mt-0 text-foreground text-base">{title}</h3>
      {children}
    </div>
  )
}

const Code: FC<PropsWithChildren<ICode>> = ({ children }) => {
  return <div className="col-span-7 not-prose">{children}</div>
}

StepHikeCompact.Step = Step
StepHikeCompact.Details = Details
StepHikeCompact.Code = Code
export default StepHikeCompact
