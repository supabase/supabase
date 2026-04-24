import { useParams } from 'common'
import { useState } from 'react'
import { ShimmeringLoader } from 'ui-patterns'

import { AppLayoutDropdownError, AppLayoutDropdownWithPopover } from './AppLayoutDropdown'
import { BranchBadge } from './BranchBadge'
import { BranchDropdownCommandContent } from './BranchDropdownCommandContent'
import { useEmbeddedCloseHandler } from './useEmbeddedCloseHandler'
import { useBranchesQuery } from '@/data/branches/branches-query'
import type { Branch } from '@/data/branches/branches-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useAppStateSnapshot } from '@/state/app-state'

interface BranchDropdownProps {
  embedded?: boolean
  className?: string
  onClose?: () => void
}

export const BranchDropdown = ({
  embedded = false,
  className,
  onClose,
}: BranchDropdownProps = {}) => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()
  const { data: projectDetails } = useSelectedProjectQuery()

  const [open, setOpen] = useState(false)
  const close = useEmbeddedCloseHandler(embedded, onClose, setOpen)

  const projectRef = projectDetails?.parent_project_ref || ref

  const {
    data: branches,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useBranchesQuery({ projectRef }, { enabled: Boolean(projectDetails) })

  const isBranchingEnabled = projectDetails?.is_branch_enabled === true
  const selectedBranch = branches?.find((branch) => branch.project_ref === ref)

  const defaultMainBranch = {
    id: 'main',
    name: 'main',
    project_ref: projectRef ?? ref ?? '',
    is_default: true,
  } as unknown as Branch

  const mainBranch = branches?.find((branch) => branch.is_default)
  const restOfBranches = branches
    ?.filter((branch) => !branch.is_default)
    ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const sortedBranches =
    branches && branches.length > 0
      ? mainBranch
        ? [mainBranch].concat(restOfBranches ?? [])
        : (restOfBranches ?? [])
      : [defaultMainBranch]
  const branchList = isBranchingEnabled ? (sortedBranches ?? []) : [defaultMainBranch]

  const commandContent = (
    <BranchDropdownCommandContent
      embedded={embedded}
      className={className}
      branchList={branchList}
      selectedBranch={selectedBranch}
      branchesCount={branches?.length ?? 0}
      isBranchingEnabled={isBranchingEnabled}
      projectRef={ref}
      onClose={close}
      onCreateBranch={() => snap.setShowCreateBranchModal(true)}
    />
  )

  if (isLoading) return <ShimmeringLoader className="p-2 md:w-[90px]" />

  if (isError) return <AppLayoutDropdownError message="Failed to load branches" />

  if (!isSuccess) return null

  if (embedded) return commandContent

  return (
    <AppLayoutDropdownWithPopover
      linkHref={`/project/${ref}`}
      linkContent={
        <>
          <span
            title={isBranchingEnabled ? selectedBranch?.name : 'main'}
            className="text-sm text-foreground max-w-32 lg:max-w-64 truncate"
          >
            {isBranchingEnabled ? selectedBranch?.name : 'main'}
          </span>
          <BranchBadge branch={selectedBranch} isBranchingEnabled={isBranchingEnabled} />
        </>
      }
      linkClassName="flex items-center gap-2 flex-shrink-0"
      commandContent={commandContent}
      open={open}
      onOpenChange={setOpen}
    />
  )
}
