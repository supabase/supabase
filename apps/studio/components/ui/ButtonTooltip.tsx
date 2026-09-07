import { ComponentProps, ComponentPropsWithoutRef, ElementRef, forwardRef, ReactNode } from 'react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

export const ButtonTooltip = forwardRef<
  ElementRef<typeof Button>,
  ComponentPropsWithoutRef<typeof Button> & {
    tooltip: {
      content: ComponentProps<typeof TooltipContent> & {
        text?: string | ReactNode
      }
    }
  }
>(({ tooltip, className, disabled, unavailable, ...props }, ref) => {
  const hasTooltip = tooltip.content.text !== undefined
  const isUnavailable = unavailable ?? (disabled === true && hasTooltip)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={ref}
          {...props}
          unavailable={isUnavailable}
          disabled={isUnavailable ? false : disabled}
          className={className}
        >
          {props.children}
        </Button>
      </TooltipTrigger>
      {tooltip.content.text !== undefined && (
        <TooltipContent {...tooltip.content}>{tooltip.content.text}</TooltipContent>
      )}
    </Tooltip>
  )
})

ButtonTooltip.displayName = 'ButtonTooltip'
