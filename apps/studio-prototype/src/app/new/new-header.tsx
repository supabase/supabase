import { forwardRef } from 'react'

const NewHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => {
    return (
      <div ref={ref} className="text-left flex flex-col gap-3" {...props}>
        {children}
      </div>
    )
  }
)

NewHeader.displayName = 'NewHeader'

const NewHeaderTitle = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => {
    return (
      <h1 ref={ref} className="text-foreground text-lg" {...props}>
        {children}
      </h1>
    )
  }
)

NewHeaderTitle.displayName = 'NewHeaderTitle'

const NewHeaderDescription = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => {
    return (
      <div ref={ref} className="text-foreground-light text-sm flex flex-col gap-2" {...props}>
        {children}
      </div>
    )
  }
)

NewHeaderDescription.displayName = 'NewHeaderDescription'

export { NewHeader, NewHeaderTitle, NewHeaderDescription }
