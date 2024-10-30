import * as React from 'react'

const ExampleLabel = React.forwardRef<HTMLSpanElement, { children: React.ReactNode }>(
  ({ children }, ref) => {
    return (
      <span ref={ref} className="text-xs flex gap-3 items-center text-foreground-muted">
        {children}
      </span>
    )
  }
)

ExampleLabel.displayName = 'ExampleLabel'

export { ExampleLabel }
