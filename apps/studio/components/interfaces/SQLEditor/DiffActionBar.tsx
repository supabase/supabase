import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconCheck,
  IconChevronDown,
  IconCornerDownLeft,
  IconLoader,
  IconX,
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
          icon={!loading ? <IconCheck /> : <IconLoader className="animate-spin" size={14} />}
          iconRight={
            <div className="opacity-30">
              <IconCornerDownLeft size={12} strokeWidth={1.5} />
            </div>
          }
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
        icon={<IconX />}
        iconRight={<span className="text-brand-500">ESC</span>}
        onClick={onCancel}
      >
        Discard
      </Button>
    </>
  )
}
