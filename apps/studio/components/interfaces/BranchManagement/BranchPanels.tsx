import dayjs from 'dayjs'
import { Github } from 'lucide-react'
import { useRouter } from 'next/router'
import { PropsWithChildren, ReactNode } from 'react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import type { Branch } from 'data/branches/branches-query'
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { WorkflowLogs } from './WorkflowLogs'

interface BranchManagementSectionProps {
  header: string | ReactNode
  footer?: ReactNode
}

export const BranchManagementSection = ({
  header,
  footer,
  children,
}: PropsWithChildren<BranchManagementSectionProps>) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-surface-100 shadow-sm flex justify-between items-center px-4 py-3 rounded-t-lg text-xs font-mono uppercase">
        {typeof header === 'string' ? <span>{header}</span> : header}
      </div>
      <div className="bg-surface border-t shadow-sm rounded-b-lg text-sm divide-y">{children}</div>
      {footer !== undefined && <div className="bg-surface-100 px-6 py-1 border-t">{footer}</div>}
    </div>
  )
}

export const BranchRowLoader = () => {
  return (
    <div className="flex items-center justify-between px-6 py-2.5">
      <div className="flex items-center gap-x-4">
        <ShimmeringLoader className="w-52" />
        <ShimmeringLoader className="w-52" />
      </div>
      <div className="flex items-center gap-x-4">
        <ShimmeringLoader className="w-52" />
        <ShimmeringLoader className="w-52" />
      </div>
    </div>
  )
}

export const BranchLoader = () => {
  return (
    <>
      <BranchRowLoader />
      <BranchRowLoader />
      <BranchRowLoader />
      <BranchRowLoader />
      <BranchRowLoader />
    </>
  )
}

interface BranchRowProps {
  repo: string
  label?: string | ReactNode
  branch: Branch
  isGithubConnected: boolean
  rowLink?: string
  external?: boolean
  rowActions?: ReactNode
}

export const BranchRow = ({
  branch,
  isGithubConnected,
  label,
  repo,
  rowLink,
  external = false,
  rowActions,
}: BranchRowProps) => {
  const router = useRouter()
  const page = router.pathname.split('/').pop()

  const daysFromNow = dayjs().diff(dayjs(branch.updated_at), 'day')
  const willBeDeletedIn = branch.deletion_scheduled_at
    ? dayjs(branch.deletion_scheduled_at).diff(dayjs(), 'minutes')
    : null
  const isDeletionPending = willBeDeletedIn !== null && willBeDeletedIn < 0
  const formattedTimeFromNow = dayjs(branch.updated_at).fromNow()
  const formattedUpdatedAt = dayjs(branch.updated_at).format('DD MMM YYYY, HH:mm:ss (ZZ)')

  const navigateUrl = rowLink ?? `/project/${branch.project_ref}`

  return (
    <div className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-100">
      <div className="flex items-center gap-x-3">
        {branch.git_branch && isGithubConnected && (
          <ButtonTooltip
            asChild
            type="default"
            className="px-1.5"
            tooltip={{ content: { side: 'bottom', text: 'View branch on GitHub' } }}
          >
            <a
              target="_blank"
              rel="noreferrer noopener"
              href={`https://github.com/${repo}/tree/${branch.git_branch}`}
            >
              <Github size={14} className="text-foreground-light" />
            </a>
          </ButtonTooltip>
        )}
        <Tooltip>
          <TooltipTrigger>
            <Link
              target={external ? '_blank' : '_self'}
              rel={external ? 'noopener noreferrer' : undefined}
              href={navigateUrl}
              className="flex items-center"
            >
              {label || branch.name}
            </Link>
          </TooltipTrigger>
          {((page === 'branches' && !branch.is_default) || page === 'merge-requests') && (
            <TooltipContent side="bottom">
              {page === 'branches' && !branch.is_default && 'Switch to branch'}
              {page === 'merge-requests' && 'View merge request'}
            </TooltipContent>
          )}
        </Tooltip>
      </div>
      <div className="flex items-center gap-x-4">
        {branch.deletion_scheduled_at ? (
          <p className="text-xs text-foreground-lighter">
            {isDeletionPending
              ? 'Deletion pending...'
              : `Will be deleted in ${willBeDeletedIn} minutes`}
          </p>
        ) : (
          <p className="text-xs text-foreground-lighter">
            {daysFromNow > 1
              ? `Updated on ${formattedUpdatedAt}`
              : `Updated ${formattedTimeFromNow}`}
          </p>
        )}
        <WorkflowLogs projectRef={branch.project_ref} status={branch.status} />
        {rowActions}
      </div>
    </div>
  )
}
