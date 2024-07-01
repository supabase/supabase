import { ComponentProps, ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { Button, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_, Tooltip_Shadcn_, cn } from 'ui'

export const ButtonTooltip = forwardRef<
  ElementRef<typeof Button>,
  ComponentPropsWithoutRef<typeof Button> & {
    tooltip: {
      content: ComponentProps<typeof TooltipContent_Shadcn_> & {
        text?: string
      }
    }
  }
>(({ ...props }, ref) => {
  return (
    <Tooltip_Shadcn_>
      <TooltipTrigger_Shadcn_ asChild>
        <Button ref={ref} {...props} className={cn(props.className, 'pointer-events-auto')}>
          {props.children}
        </Button>
      </TooltipTrigger_Shadcn_>
      {props.disabled && props.tooltip.content.text !== undefined && (
        <TooltipContent_Shadcn_ {...props.tooltip.content}>
          {props.tooltip.content.text}
        </TooltipContent_Shadcn_>
      )}
    </Tooltip_Shadcn_>
  )
})

ButtonTooltip.displayName = 'ButtonTooltip'
