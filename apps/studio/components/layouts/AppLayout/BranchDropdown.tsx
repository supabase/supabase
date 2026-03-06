import { useParams } from 'common'
import { useBranchesQuery } from 'data/branches/branches-query'
import type { Branch } from 'data/branches/branches-query'
import { useEmbeddedCloseHandler } from './useEmbeddedCloseHandler'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { AlertCircle, ChevronsUpDown } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import {
  Badge,
  Button,
  cn,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { BranchDropdownCommandContent } from './BranchDropdownCommandContent'

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
        : restOfBranches ?? []
      : [defaultMainBranch]
  const branchList = isBranchingEnabled ? sortedBranches ?? [] : [defaultMainBranch]

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

  if (isLoading) {
    return <ShimmeringLoader className="w-[90px]" />
  }

  if (isError) {
    return (
      <div className="flex items-center space-x-2 text-amber-900">
        <AlertCircle size={16} strokeWidth={1.5} />
        <p className="text-sm">Failed to load branches</p>
      </div>
    )
  }

  if (!isSuccess) return null

  if (embedded) {
    return commandContent
  }

  return (
    <>
      <Link href={`/project/${ref}`} className="flex items-center gap-2 flex-shrink-0">
        <span
          title={isBranchingEnabled ? selectedBranch?.name : 'main'}
          className="text-sm text-foreground max-w-32 lg:max-w-64 truncate"
        >
          {isBranchingEnabled ? selectedBranch?.name : 'main'}
        </span>
        {isBranchingEnabled ? (
          selectedBranch?.is_default ? (
            <Badge variant="warning" className="mt-[1px]">
              Production
            </Badge>
          ) : selectedBranch?.persistent ? (
            <Badge variant="success" className="mt-[1px]">
              Persistent
            </Badge>
          ) : (
            <Badge variant="success" className="mt-[1px]">
              Preview
            </Badge>
          )
        ) : (
          <Badge variant="warning" className="mt-[1px]">
            Production
          </Badge>
        )}
      </Link>
      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            type="text"
            block
            size="tiny"
            className={cn('px-1.5 py-4 [&_svg]:w-5 [&_svg]:h-5 ml-1')}
            iconRight={<ChevronsUpDown strokeWidth={1.5} />}
          />
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
          {commandContent}
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </>
  )
}
