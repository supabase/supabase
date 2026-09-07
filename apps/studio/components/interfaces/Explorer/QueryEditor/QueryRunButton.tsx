import { ChevronDown, Play } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  KeyboardShortcut,
} from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'

interface QueryRunButtonProps {
  isExecuting: boolean
  disabled: boolean
  hasSelection: boolean
  onRun: () => void
  onRunSelected: () => void
}

export const QueryRunButton = ({
  isExecuting,
  disabled,
  hasSelection,
  onRun,
  onRunSelected,
}: QueryRunButtonProps) => {
  return (
    <div className="flex w-fit">
      <ButtonTooltip
        type="button"
        variant="default"
        size="tiny"
        loading={isExecuting}
        disabled={disabled}
        icon={<Play size={16} strokeWidth={2} />}
        className="rounded-r-none hover:z-10 focus-visible:z-10 focus-visible:rounded-r-sm"
        onClick={onRun}
        tooltip={{
          content: {
            side: 'bottom',
            text: (
              <div className="flex items-center gap-2.5">
                <span>Run query</span>
                <KeyboardShortcut keys={['Meta', 'Enter']} />
              </div>
            ),
          },
        }}
      >
        Run
      </ButtonTooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="default"
            size="tiny"
            disabled={disabled}
            aria-label="More actions"
            className="shrink-0 rounded-l-none px-[4px] py-[5px] -ml-px focus-visible:z-10 focus-visible:rounded-l-sm"
            icon={<ChevronDown />}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItemTooltip
            disabled={!hasSelection}
            onClick={onRunSelected}
            tooltip={{
              content: {
                side: 'left',
                text: !hasSelection
                  ? 'Select SQL in the editor to run part of the query'
                  : undefined,
              },
            }}
          >
            Run selected
          </DropdownMenuItemTooltip>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
