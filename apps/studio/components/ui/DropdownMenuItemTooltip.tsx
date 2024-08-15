import { ComponentProps, ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import {
  DropdownMenuItem,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'

export const DropdownMenuItemTooltip = forwardRef<
  ElementRef<typeof DropdownMenuItem>,
  ComponentPropsWithoutRef<typeof DropdownMenuItem> & {
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
        <DropdownMenuItem
          ref={ref}
          {...props}
          className={cn(props.className, '!pointer-events-auto')}
          onClick={(e) => {
            if (!props.disabled && props.onClick) props.onClick(e)
          }}
        >
          {props.children}
        </DropdownMenuItem>
      </TooltipTrigger_Shadcn_>
      {props.disabled && props.tooltip.content.text !== undefined && (
        <TooltipContent_Shadcn_ {...props.tooltip.content}>
          {props.tooltip.content.text}
        </TooltipContent_Shadcn_>
      )}
    </Tooltip_Shadcn_>
  )
})

DropdownMenuItemTooltip.displayName = 'DropdownMenuItemTooltip'
