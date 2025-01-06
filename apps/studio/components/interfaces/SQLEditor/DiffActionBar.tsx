import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { ChevronDown, CornerDownLeft, Loader2 } from 'lucide-react'
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
          icon={loading && <Loader2 className="animate-spin" />}
          iconRight={<CornerDownLeft size={12} strokeWidth={1.5} />}
          onClick={onAccept}
        >
          {getDiffTypeButtonLabel(selectedDiffType)}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="primary"
              className="rounded-l-none border-l-0 px-[4px] py-[5px] flex"
              icon={<ChevronDown />}
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
        className="bg-brand-300 hover:bg-brand-400 dark:bg-brand-400 dark:hover:bg-brand-500 text-brand-600 group"
        iconRight={<span className="dark:text-brand-500 group-hover:text-brand-600">ESC</span>}
        onClick={onCancel}
      >
        Discard
      </Button>
    </>
  )
}
