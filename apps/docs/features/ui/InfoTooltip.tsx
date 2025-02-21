'use client'

import React, {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
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
  const id = useId().replaceAll(':', '')
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [tooltipOpen, _setTooltipOpen] = useState(false)
  const isMobile = useBreakpoint('md')

  const setTooltipOpen = useCallback(
    (open: boolean) => {
      _setTooltipOpen(open)
      setMobileSheetOpen(true)

      timeout.current = setTimeout(() => {
        if (isMobile) return
        const targetElem: HTMLElement | null = document.querySelector(`#tooltip-content-${id}`)
        targetElem?.focus()
      })
    },
    [_setTooltipOpen, id, isMobile]
  )

  useEffect(() => () => clearTimeout(timeout.current), [])

  return (
    <>
      <Tooltip open={tooltipOpen} onOpenChange={(open) => !isMobile && setTooltipOpen(open)}>
        <TooltipTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            onClick={() => setMobileSheetOpen(true)}
            className={cn(buttonClassName, className)}
          >
            {children}
            <InfoIcon
              aria-hidden={true}
              className="absolute p-[1px] bg-background rounded-full -left-1.5 -top-1.5 w-3 h-3 text-foreground-lighter group-hover/inline-popup:text-foreground-light transition-colors"
            />
          </span>
        </TooltipTrigger>
        <TooltipContent id={`tooltip-content-${id}`} className={contentContainerClassName}>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
      {isMobile && (
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetContent
            id={`mobile-sheet-content-${id}`}
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
                <Button type="text" onClick={() => setMobileSheetOpen(false)} className="px-1">
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
