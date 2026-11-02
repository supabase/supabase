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
>(({ tooltip, className, disabled, focusableWhenDisabled, ...props }, ref) => {
  const { text, ...tooltipContentProps } = tooltip.content
  const hasTooltip = text !== undefined
  const shouldRemainFocusable = focusableWhenDisabled ?? (disabled === true && hasTooltip)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={ref}
          {...props}
          disabled={disabled}
          focusableWhenDisabled={shouldRemainFocusable}
          className={className}
        >
          {props.children}
        </Button>
      </TooltipTrigger>
      {text !== undefined && <TooltipContent {...tooltipContentProps}>{text}</TooltipContent>}
    </Tooltip>
  )
})

ButtonTooltip.displayName = 'ButtonTooltip'
