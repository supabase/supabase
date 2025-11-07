import * as React from 'react'

const ClassLabel = React.forwardRef<HTMLSpanElement, { children: React.ReactNode }>(
  ({ children }, ref) => {
    return (
      <span
        ref={ref}
        className="bg-surface-100 rounded-full border px-2 font-mono text-xs text-foreground-lighter group-data-[state=open]:text-foreground"
      >
        {children}
      </span>
    )
  }
)

ClassLabel.displayName = 'ClassLabel'

export { ClassLabel }
