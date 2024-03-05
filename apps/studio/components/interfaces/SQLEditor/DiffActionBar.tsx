import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconChevronDown,
  IconCornerDownLeft,
  IconLoader,
} from 'ui'

import { DiffType } from './SQLEditor.types'
import { getDiffTypeButtonLabel, getDiffTypeDropdownLabel } from './SQLEditor.utils'

type DiffActionBarProps = {
  loading: boolean
  selectedDiffType: DiffType
  onChangeDiffType: (type: DiffType) => void
  onAccept: () => void
  onCancel: () => void
}

export const DiffActionBar = ({
  loading,
  selectedDiffType,
  onChangeDiffType,
  onAccept,
  onCancel,
}: DiffActionBarProps) => {
  return (
    <>
      <div className="flex items-center">
        <Button
          className="rounded-r-none"
          type="primary"
          size="tiny"
          icon={loading && <IconLoader className="animate-spin" size={14} />}
          iconRight={<IconCornerDownLeft size={12} strokeWidth={1.5} className="text-foreground" />}
          onClick={onAccept}
        >
          {getDiffTypeButtonLabel(selectedDiffType)}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="primary"
              className="rounded-l-none border-l-0 px-[4px] py-[5px] flex"
              icon={<IconChevronDown />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom">
            {Object.values(DiffType)
              .filter((diffType) => diffType !== selectedDiffType)
              .map((diffType) => (
                <DropdownMenuItem key={diffType} onClick={() => onChangeDiffType(diffType)}>
                  <p>{getDiffTypeDropdownLabel(diffType)}</p>
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Button
        type="alternative"
        size="tiny"
        iconRight={<span className="text-foreground-lighter">ESC</span>}
        onClick={onCancel}
      >
        Discard
      </Button>
    </>
  )
}
