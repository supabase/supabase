import React from 'react'
import { Command, Search } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent, Button, cn } from 'ui'
import { useCommandMenuOpen, useSetCommandMenuOpen } from 'ui-patterns'
import { useCommandMenuTelemetryContext } from 'ui-patterns'
import type { CommandMenuOpenedEvent } from 'common/telemetry-constants'

const CommandPopover = () => {
  const open = useCommandMenuOpen()
  const setOpen = useSetCommandMenuOpen()
  const telemetryContext = useCommandMenuTelemetryContext()

  const handleOpen = () => {
    setOpen(!open)
    if (!open && telemetryContext?.onTelemetry) {
      const event = {
        action: 'command_menu_opened' as const,
        properties: {
          trigger_type: 'search_input' as const,
          app: 'studio',
        },
        groups: {},
      }

      telemetryContext.onTelemetry(event as CommandMenuOpenedEvent)
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          id="command-search-button"
          type="outline"
          size="tiny"
          className={cn(
            'rounded-full w-[32px] h-[32px] flex items-center text-foreground-light hover:text-foreground justify-center p-0 group cursor-pointer',
            open && 'text-background bg-foreground'
          )}
          onClick={handleOpen}
        >
          <Search size={16} strokeWidth={1.5} className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="flex gap-2 pl-2 pr-1.5">
        Search...{' '}
        <div
          aria-hidden="true"
          className="md:flex items-center justify-center h-full px-1 border rounded bg-surface-300 gap-0.5"
        >
          <Command size={12} strokeWidth={1.5} />
          <span className="text-[12px]">K</span>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export default CommandPopover
