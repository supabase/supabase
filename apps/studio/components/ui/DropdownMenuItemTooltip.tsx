import { ComponentProps, ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { DropdownMenuItem, Tooltip, TooltipContent, TooltipTrigger, cn } from 'ui'

export const DropdownMenuItemTooltip = forwardRef<
  ElementRef<typeof DropdownMenuItem>,
  ComponentPropsWithoutRef<typeof DropdownMenuItem> & {
    tooltip: {
      content: ComponentProps<typeof TooltipContent> & {
        text?: string
      }
    }
  }
>(({ ...props }, ref) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <DropdownMenuItem
          ref={ref}
          {...props}
          aria-label={props.tooltip?.content?.text}
          className={cn(props.className, '!pointer-events-auto')}
          onClick={(e) => {
            if (!props.disabled && props.onClick) props.onClick(e)
          }}
        >
          {props.children}
        </DropdownMenuItem>
      </TooltipTrigger>

      {props.disabled && props.tooltip.content.text !== undefined && (
        <TooltipContent {...props.tooltip.content}>{props.tooltip.content.text}</TooltipContent>
      )}
    </Tooltip>
  )
})

DropdownMenuItemTooltip.displayName = 'DropdownMenuItemTooltip'
