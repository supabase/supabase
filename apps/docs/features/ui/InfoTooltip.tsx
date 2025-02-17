import { InfoIcon } from 'lucide-react'
import React, { PropsWithChildren } from 'react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface PopUpProps extends PropsWithChildren {
  tooltipContent: React.ReactNode
  className?: string
  contentContainerClassName?: string
}

const InfoTooltip = ({
  children,
  className,
  tooltipContent,
  contentContainerClassName,
}: PopUpProps) => {
  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          'relative px-1 py-0 -my-px',
          'rounded bg-surface-200 border border-dashed',
          'transition-colors hover:border-strong group/inline-popup',
          className
        )}
      >
        {children}
        <InfoIcon className="absolute p-[1px] bg-background rounded-full -right-1 -top-1 w-3 h-3 text-foreground-lighter group-hover/inline-popup:text-foreground-light transition-colors" />
      </TooltipTrigger>
      <TooltipContent className={contentContainerClassName}>{tooltipContent}</TooltipContent>
    </Tooltip>
  )
}

export default InfoTooltip
