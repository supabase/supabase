import { ArrowDownNarrowWide, ArrowDownWideNarrow } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'

import {
  PROJECT_LIST_SORT_LABELS,
  PROJECT_LIST_SORT_VALUES,
  type ProjectListSort,
} from './ProjectListSort.utils'

interface ProjectListSortDropdownProps {
  value: ProjectListSort
  onChange: (value: ProjectListSort) => void
}

const getSortColumnLabel = (value: ProjectListSort) => {
  if (value.startsWith('created')) return 'created'
  return 'project'
}

export const ProjectListSortDropdown = ({ value, onChange }: ProjectListSortDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="default"
          size="tiny"
          icon={
            value.endsWith('desc') ? (
              <ArrowDownWideNarrow size={14} />
            ) : (
              <ArrowDownNarrowWide size={14} />
            )
          }
        >
          Sorted by {getSortColumnLabel(value)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(val) => onChange(val as ProjectListSort)}
        >
          {PROJECT_LIST_SORT_VALUES.map((sortValue) => (
            <DropdownMenuRadioItem key={sortValue} value={sortValue}>
              {PROJECT_LIST_SORT_LABELS[sortValue]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
