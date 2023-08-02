import clsx from 'clsx'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { noop } from 'lodash'
import Link from 'next/link'
import { PropsWithChildren, forwardRef, useState } from 'react'
import {
  Badge,
  Button,
  Dropdown,
  DropdownMenuContent_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
  IconExternalLink,
  IconGitBranch,
  IconGitHub,
  IconMoreVertical,
  IconShield,
  IconTrash,
  cn,
} from 'ui'

import { Markdown } from 'components/interfaces/Markdown'
import { Branch } from 'data/branches/branches-query'

interface BranchPanelProps {
  repo?: string
  branch: Branch
  onSelectUpdate?: () => void
  onSelectDelete?: () => void
  onSelectDisableBranching?: () => void
  generatePullRequestURL?: (branch?: string) => string
}

const MainBranchPanel = ({ repo, branch, onSelectDisableBranching = noop }: BranchPanelProps) => {
  const { ref } = useParams()
  const [open, setOpen] = useState(false)
  const isActive = ref === branch.project_ref

  return (
    <div className="border rounded-lg">
      <div className="bg-surface-200 shadow-sm flex justify-between items-center pl-8 pr-6 py-3 rounded-t-lg text-sm">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-scale-200 rounded-md flex items-center justify-center">
            <IconGitHub size={18} strokeWidth={2} />
          </div>
          <p>Github branch workflow</p>
          <Link passHref href={`https://github.com/${repo}`}>
            <a target="_blank" rel="noreferrer">
              <Button
                type="text"
                size="small"
                className="text-light hover:text py-1 px-1.5"
                iconRight={<IconExternalLink size={14} strokeWidth={1.5} />}
              >
                {repo}
              </Button>
            </a>
          </Link>
        </div>
      </div>
      <div className="bg-surface-100 border-t shadow-sm flex justify-between items-center pl-8 pr-6 py-3 rounded-b-lg text-sm">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-amber-300 rounded-md flex items-center justify-center">
            <IconShield size={18} strokeWidth={2} className="text-amber-900" />
          </div>
          <p>{branch.name}</p>
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
              <DropdownMenuItem_Shadcn_ className="flex gap-2" onSelect={() => {}}>
                Change production branch
              </DropdownMenuItem_Shadcn_>
              <Dropdown.Separator />
              <DropdownMenuItem_Shadcn_
                className="flex gap-2"
                onSelect={() => onSelectDisableBranching()}
              >
                Disable branching
              </DropdownMenuItem_Shadcn_>
            </DropdownMenuContent_Shadcn_>
          </DropdownMenu_Shadcn_>
        </div>
      </div>
    </div>
  )
}

const BranchContainer = ({ className, children }: PropsWithChildren<{ className?: string }>) => {
  return (
    <div className="list-none ml-6 pl-8 pb-4 border-l border-scale-600 dark:border-scale-400 relative last:!border-transparent">
      <div className="absolute w-[33px] rounded-bl-full border-b border-l border-scale-600 dark:border-scale-400 h-10 -left-px" />
      <div
        className={clsx(
          'border shadow-sm flex justify-between items-center pl-8 pr-6 py-4 rounded-lg text-sm',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

const BranchPanel = ({
  branch,
  generatePullRequestURL,
  onSelectDelete = noop,
}: BranchPanelProps) => {
  const { ref } = useParams()
  const [open, setOpen] = useState(false)

  const isActive = ref === branch.project_ref
  const daysFromNow = dayjs().diff(dayjs(branch.created_at), 'day')
  const formattedTimeFromNow = dayjs(branch.created_at).fromNow()
  const formattedCreatedAt = dayjs(branch.created_at).format('DD MMM YYYY, HH:mm:ss (ZZ)')

  const pullRequestURL = generatePullRequestURL?.(branch.name) ?? 'https://github.com'

  return (
    <BranchContainer className="bg-surface-100">
      <div className="flex items-center space-x-4">
        <IconGitBranch className="text-brand-900" size={16} strokeWidth={2} />
        <p>{branch.name}</p>
        {isActive && <Badge color="green">Selected</Badge>}
        <p className="text-scale-1000">
          {daysFromNow > 1 ? `Created on ${formattedCreatedAt}` : `Created ${formattedTimeFromNow}`}
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <Link passHref href={pullRequestURL}>
          <a target="_blank" rel="noreferrer">
            <Button>Create pull request</Button>
          </a>
        </Link>
        <DropdownMenu_Shadcn_ open={open} onOpenChange={() => setOpen(!open)} modal={false}>
          <DropdownMenuTrigger_Shadcn_>
            <Button asChild type="text" className="px-1" icon={<IconMoreVertical size={14} />}>
              <span></span>
            </Button>
          </DropdownMenuTrigger_Shadcn_>
          <DropdownMenuContent_Shadcn_ side="bottom" align="end">
            <DropdownMenuItem_Shadcn_ className="flex gap-2" onSelect={() => onSelectDelete()}>
              <IconTrash size={14} />
              Delete branch
            </DropdownMenuItem_Shadcn_>
          </DropdownMenuContent_Shadcn_>
        </DropdownMenu_Shadcn_>
      </div>
    </BranchContainer>
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
export { BranchContainer, BranchHeader, BranchPanel, MainBranchPanel }
