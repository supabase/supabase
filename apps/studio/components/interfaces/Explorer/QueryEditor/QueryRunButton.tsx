import { ChevronDownIcon, PlayIcon } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  KeyboardShortcut,
  SplitButtonGroup,
} from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

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
    <SplitButtonGroup className="ml-1 w-fit">
      <ButtonTooltip
        type="button"
        size="tiny"
        loading={isExecuting}
        disabled={disabled}
        icon={<PlayIcon size={16} strokeWidth={2} />}
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
            size="tiny"
            disabled={disabled}
            aria-label="More actions"
            className="shrink-0 px-1 py-1.25"
            icon={<ChevronDownIcon />}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem disabled={!hasSelection} onClick={onRunSelected}>
            Run selected SQL
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SplitButtonGroup>
  )
}
