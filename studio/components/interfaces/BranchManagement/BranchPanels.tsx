import dayjs from 'dayjs'
import { forwardRef, useState } from 'react'
import {
  Badge,
  Button,
  DropdownMenuContent_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
  IconEdit,
  IconGitBranch,
  IconGitHub,
  IconMoreVertical,
  IconShield,
  IconTrash,
  cn,
} from 'ui'

import { Markdown } from 'components/interfaces/Markdown'
import { Branch } from 'data/branches/branches-query'
import { noop } from 'lodash'
import { useParams } from 'common'

interface BranchPanelProps {
  branch?: Branch
  onSelectUpdate?: () => void
  onSelectDelete?: () => void
}

const MainBranchPanel = ({ branch, onSelectUpdate = noop }: BranchPanelProps) => {
  const { ref } = useParams()
  const [open, setOpen] = useState(false)
  const isActive = ref === branch?.project_ref

  return (
    <div className="border rounded-lg">
      <div className="bg-surface-200 shadow-sm flex justify-between items-center pl-8 pr-6 py-3 rounded-t-lg text-sm">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-scale-200 rounded-md flex items-center justify-center">
            <IconGitHub size={18} strokeWidth={2} />
          </div>
          <p>Github branch workflow</p>
        </div>
      </div>
      <div className="bg-surface-100 border-t shadow-sm flex justify-between items-center pl-8 pr-6 py-3 rounded-b-lg text-sm">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-amber-300 rounded-md flex items-center justify-center">
            <IconShield size={18} strokeWidth={2} className="text-amber-900" />
          </div>
          <p>{branch?.name}</p>
          <Badge color="amber">Production</Badge>
          {isActive && <Badge color="green">Selected</Badge>}
        </div>
        <div className="flex items-center space-x-4">
          <DropdownMenu_Shadcn_ open={open} onOpenChange={() => setOpen(!open)} modal={false}>
            <DropdownMenuTrigger_Shadcn_>
              <Button asChild type="text" className="px-1" icon={<IconMoreVertical size={14} />}>
                <span></span>
              </Button>
            </DropdownMenuTrigger_Shadcn_>
            <DropdownMenuContent_Shadcn_ side="bottom" align="end">
              <DropdownMenuItem_Shadcn_ className="flex gap-2" onSelect={() => onSelectUpdate()}>
                <IconEdit size={14} />
                Edit branch
              </DropdownMenuItem_Shadcn_>
            </DropdownMenuContent_Shadcn_>
          </DropdownMenu_Shadcn_>
        </div>
      </div>
    </div>
  )
}

const BranchPanel = ({
  branch,
  onSelectUpdate = noop,
  onSelectDelete = noop,
}: BranchPanelProps) => {
  const { ref } = useParams()
  const [open, setOpen] = useState(false)

  const isActive = ref === branch?.project_ref
  const daysFromNow = dayjs().diff(dayjs(branch?.created_at), 'day')
  const formattedTimeFromNow = dayjs(branch?.created_at).fromNow()
  const formattedCreatedAt = dayjs(branch?.created_at).format('DD MMM YYYY, HH:mm:ss (ZZ)')

  return (
    <li className="list-none ml-6 pl-8 pb-4 border-l border-scale-600 dark:border-scale-400 relative last:!border-transparent">
      <div className="absolute w-[33px] rounded-bl-full border-b border-l border-scale-600 dark:border-scale-400 h-10 -left-px" />
      <div className="bg-surface-100 border shadow-sm flex justify-between items-center pl-8 pr-6 py-4 rounded-lg text-sm">
        <div className="flex items-center space-x-4">
          <IconGitBranch className="text-brand-900" size={16} strokeWidth={2} />
          <p>{branch?.name}</p>
          {isActive && <Badge color="green">Selected</Badge>}
          <p className="text-scale-1000">
            {daysFromNow > 1
              ? `Created on ${formattedCreatedAt}`
              : `Created ${formattedTimeFromNow}`}
          </p>
        </div>
        <div>
          <DropdownMenu_Shadcn_ open={open} onOpenChange={() => setOpen(!open)} modal={false}>
            <DropdownMenuTrigger_Shadcn_>
              <Button asChild type="text" className="px-1" icon={<IconMoreVertical size={14} />}>
                <span></span>
              </Button>
            </DropdownMenuTrigger_Shadcn_>
            <DropdownMenuContent_Shadcn_ side="bottom" align="end">
              <DropdownMenuItem_Shadcn_ className="flex gap-2" onSelect={() => onSelectUpdate()}>
                <IconEdit size={14} />
                Edit branch
              </DropdownMenuItem_Shadcn_>
              <DropdownMenuItem_Shadcn_ className="flex gap-2" onSelect={() => onSelectDelete()}>
                <IconTrash size={14} />
                Delete branch
              </DropdownMenuItem_Shadcn_>
            </DropdownMenuContent_Shadcn_>
          </DropdownMenu_Shadcn_>
        </div>
      </div>
    </li>
  )
}

interface BranchHeader extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
  markdown?: string
}

const BranchHeader = forwardRef<HTMLDivElement, BranchHeader>(
  ({ className, name, markdown = '', ...props }, ref) => {
    return (
      <div
        {...props}
        ref={ref}
        className={cn(
          'border-l border-scale-600 dark:border-scale-400 ml-6 pl-8 pt-6 pb-3',
          className
        )}
      >
        <Markdown content={markdown} className="" />
      </div>
    )
  }
)

BranchHeader.displayName = 'BranchHeader'
export { BranchHeader, MainBranchPanel, BranchPanel }
