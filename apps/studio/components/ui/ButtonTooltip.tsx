import { ComponentProps, ComponentPropsWithoutRef, ElementRef, ReactNode, forwardRef } from 'react'
import { Button, Tooltip, TooltipContent, TooltipTrigger, cn } from 'ui'

export const ButtonTooltip = forwardRef<
  ElementRef<typeof Button>,
  ComponentPropsWithoutRef<typeof Button> & {
    tooltip: {
      content: ComponentProps<typeof TooltipContent> & {
        text?: string | ReactNode
      }
    }
  }
>(({ ...props }, ref) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={ref}
          {...props}
          className={cn(props.className, 'pointer-events-auto')}
          onClick={(e) => {
            if (props.disabled) e.preventDefault()
          }}
        >
          {props.children}
        </Button>
      </TooltipTrigger>
      {props.tooltip.content.text !== undefined && (
        <TooltipContent {...props.tooltip.content}>{props.tooltip.content.text}</TooltipContent>
      )}
    </Tooltip>
  )
})

ButtonTooltip.displayName = 'ButtonTooltip'
