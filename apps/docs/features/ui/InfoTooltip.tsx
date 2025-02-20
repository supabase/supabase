'use client'

import React, { PropsWithChildren, useState } from 'react'
import { InfoIcon, XIcon } from 'lucide-react'
import { ErrorBoundary } from 'react-error-boundary'
import { useBreakpoint } from 'common'
import {
  Button,
  cn,
  CommandEmpty_Shadcn_,
  Sheet,
  SheetContent,
  SheetHeader,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

interface PopUpProps extends PropsWithChildren {
  tooltipContent: React.ReactNode
  className?: string
  contentContainerClassName?: string
}

const buttonClassName = cn(
  'relative px-1 py-0 -my-px',
  'rounded bg-surface-200 border border-dashed',
  'transition-colors hover:border-strong group/inline-popup'
)

const InfoTooltip = ({
  children,
  className,
  tooltipContent,
  contentContainerClassName,
}: PopUpProps) => {
  const [open, setOpen] = useState(false)
  const isMobile = useBreakpoint('md')

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(buttonClassName, className)} onClick={() => setOpen(true)}>
            {children}
            <InfoIcon className="absolute p-[1px] bg-background rounded-full -left-1.5 -top-1.5 w-3 h-3 text-foreground-lighter group-hover/inline-popup:text-foreground-light transition-colors" />
          </span>
        </TooltipTrigger>
        <TooltipContent className={contentContainerClassName}>{tooltipContent}</TooltipContent>
      </Tooltip>
      {isMobile && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            id="mobile-sheet-content"
            showClose={false}
            size="full"
            side="bottom"
            className={cn(
              'md:hidden',
              'text-foreground-lighter',
              'rounded-t-lg overflow-hidden overflow-y-scroll',
              'w-full h-fit min-h-[200px] py-2 px-4'
            )}
          >
            <ErrorBoundary FallbackComponent={() => <CommandEmpty_Shadcn_ />}>
              <SheetHeader className="flex items-center justify-between gap-2 px-0 py-2 mb-2 max-w-full">
                <div className="flex items-center gap-2 max-w-[90%]">
                  <InfoIcon className="p-[1px] min-w-4 min-h-4 text-foreground-lighter" />
                  <p className="italic text-foreground-light truncate">{children}</p>
                </div>
                <Button type="text" onClick={() => setOpen(false)} className="px-1">
                  <XIcon className="w-4 h-4 text-foreground-lighter" />
                </Button>
              </SheetHeader>
              {tooltipContent}
            </ErrorBoundary>
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}

export default InfoTooltip
