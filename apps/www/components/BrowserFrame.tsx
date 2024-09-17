import React, { PropsWithChildren } from 'react'
import { cn } from 'ui'

interface Props extends PropsWithChildren {
  className?: string
  contentClassName?: string
}

const BrowserFrame: React.FC<Props> = ({ children, className, contentClassName }) => {
  return (
    <div
      className={cn(
        'relative rounded-2xl shadow-lg p-2 pt-0 w-full h-full bg-alternative-200 border flex flex-col',
        className
      )}
    >
      <div className="w-full px-2 py-3 relative flex items-center gap-1.5 lg:gap-2">
        <div className="w-2 h-2 bg-border rounded-full" />
        <div className="w-2 h-2 bg-border rounded-full" />
        <div className="w-2 h-2 bg-border rounded-full" />
      </div>
      <div className={cn('h-full w-full rounded-lg', contentClassName)}>{children}</div>
    </div>
  )
}

export default BrowserFrame
