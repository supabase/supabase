import React, { PropsWithChildren } from 'react'
import { cn } from 'ui'

interface Props extends PropsWithChildren {
  className?: string
  contentClassName?: string
  hasFrameButtons?: boolean
}

const BrowserFrame: React.FC<Props> = ({
  children,
  className,
  contentClassName,
  hasFrameButtons = true,
}) => {
  return (
    <div
      className={cn(
        'relative rounded-2xl shadow-lg p-2 w-full h-full bg-alternative-200 border flex flex-col',
        className
      )}
    >
      {hasFrameButtons && (
        <div className="w-full px-2 pt-1 pb-3 relative flex items-center gap-1.5 lg:gap-2">
          <div className="w-2 h-2 bg-border rounded-full" />
          <div className="w-2 h-2 bg-border rounded-full" />
          <div className="w-2 h-2 bg-border rounded-full" />
        </div>
      )}
      <div className={cn('h-full w-full rounded-lg', contentClassName)}>{children}</div>
    </div>
  )
}

export default BrowserFrame
