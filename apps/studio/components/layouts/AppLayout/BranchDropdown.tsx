import { useParams } from 'common'
import { useBranchesQuery } from 'data/branches/branches-query'
import type { Branch } from 'data/branches/branches-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  ListTree,
  MessageCircle,
  Plus,
  Shield,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import {
  Badge,
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { sanitizeRoute } from './ProjectDropdown'

const BranchLink = ({
  branch,
  isSelected,
  onClose,
}: {
  branch: Branch
  isSelected: boolean
  onClose: () => void
}) => {
  const router = useRouter()
  const sanitizedRoute = sanitizeRoute(router.route, router.query)
  const href =
    sanitizedRoute?.replace('[ref]', branch.project_ref) ?? `/project/${branch.project_ref}`

  return (
    <Link passHref href={href}>
      <CommandItem_Shadcn_
        value={branch.name.replaceAll('"', '')}
        className="cursor-pointer w-full flex items-center justify-between text-sm md:text-xs"
        onSelect={() => {
          onClose()
          router.push(href)
        }}
        onClick={() => onClose()}
      >
        <p className="truncate w-60 flex items-center gap-1" title={branch.name}>
          {branch.is_default && <Shield size={14} className="text-amber-900" />}
          {branch.name}
        </p>
        {isSelected && <Check size={14} strokeWidth={1.5} />}
      </CommandItem_Shadcn_>
    </Link>
  )
}

interface BranchDropdownProps {
  /** When true, render only the command list (no link/trigger). For use inside sheet or popover. */
  embedded?: boolean
  /** Applied to the root when embedded. Use e.g. "bg-transparent" to inherit sheet background. */
  className?: string
  /** When embedded, called when selection should close the parent (e.g. sheet). */
  onClose?: () => void
}

export const BranchDropdown = ({
  embedded = false,
  className,
  onClose,
}: BranchDropdownProps = {}) => {
  const router = useRouter()
  const { ref } = useParams()
  const snap = useAppStateSnapshot()
  const { data: projectDetails } = useSelectedProjectQuery()

  const [open, setOpen] = useState(false)

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

  const BRANCHING_GITHUB_DISCUSSION_LINK = 'https://github.com/orgs/supabase/discussions/18937'
  const close = embedded ? onClose ?? (() => {}) : () => setOpen(false)

  const commandContent = embedded ? (
    <Command_Shadcn_ className={cn(className, 'flex flex-col flex-1 min-h-0 overflow-hidden')}>
      <div className="grid grid-cols-2 gap-2 shrink-0 p-2 border-b">
        <Button
          type="text"
          size="small"
          asChild
          block
          icon={<ListTree size={14} strokeWidth={1.5} />}
        >
          <Link
            href={`/project/${ref}/branches`}
            className="text-xs text-foreground-light hover:text-foreground"
            onClick={() => close()}
          >
            Manage branches
          </Link>
        </Button>
        <Button
          type="text"
          size="small"
          asChild
          block
          icon={<MessageCircle size={14} strokeWidth={1.5} />}
        >
          <a
            target="_blank"
            rel="noreferrer noopener"
            href={BRANCHING_GITHUB_DISCUSSION_LINK}
            onClick={() => close()}
            className="text-xs text-foreground-light hover:text-foreground"
          >
            Branching feedback
          </a>
        </Button>
        <Button
          type="default"
          size="small"
          block
          className="col-span-full text-xs text-foreground-light hover:text-foreground"
          onClick={() => {
            close()
            snap.setShowCreateBranchModal(true)
          }}
          icon={<Plus size={14} strokeWidth={1.5} />}
        >
          Create branch
        </Button>
      </div>
      {isBranchingEnabled && (
        <CommandInput_Shadcn_ placeholder="Find branch..." wrapperClassName="shrink-0 border-b" />
      )}
      <CommandList_Shadcn_ className="flex flex-col flex-1 p-1 min-h-0 overflow-y-auto !max-h-none">
        {isBranchingEnabled && <CommandEmpty_Shadcn_>No branches found</CommandEmpty_Shadcn_>}
        <CommandGroup_Shadcn_ className="min-h-0">
          {branchList.map((branch) => (
            <BranchLink
              key={branch.id}
              branch={branch}
              isSelected={branch.id === selectedBranch?.id || branches?.length === 0}
              onClose={close}
            />
          ))}
        </CommandGroup_Shadcn_>
      </CommandList_Shadcn_>
    </Command_Shadcn_>
  ) : (
    <Command_Shadcn_ className={className}>
      {isBranchingEnabled && <CommandInput_Shadcn_ placeholder="Find branch..." />}
      <CommandList_Shadcn_>
        {isBranchingEnabled && <CommandEmpty_Shadcn_>No branches found</CommandEmpty_Shadcn_>}
        <CommandGroup_Shadcn_>
          <ScrollArea className="max-h-[210px] overflow-y-auto">
            {branchList.map((branch) => (
              <BranchLink
                key={branch.id}
                branch={branch}
                isSelected={branch.id === selectedBranch?.id || branches?.length === 0}
                onClose={close}
              />
            ))}
          </ScrollArea>
        </CommandGroup_Shadcn_>

        <CommandSeparator_Shadcn_ />

        <CommandGroup_Shadcn_>
          <CommandItem_Shadcn_
            className="cursor-pointer w-full"
            onSelect={() => {
              close()
              snap.setShowCreateBranchModal(true)
            }}
            onClick={() => {
              close()
              snap.setShowCreateBranchModal(true)
            }}
          >
            <div className="w-full flex items-center gap-2">
              <Plus size={14} strokeWidth={1.5} />
              <p>Create branch</p>
            </div>
          </CommandItem_Shadcn_>
          <CommandItem_Shadcn_
            className="cursor-pointer w-full"
            onSelect={() => {
              close()
              router.push(`/project/${ref}/branches`)
            }}
            onClick={() => close()}
          >
            <Link href={`/project/${ref}/branches`} className="w-full flex items-center gap-2">
              <ListTree size={14} strokeWidth={1.5} />
              <p>Manage branches</p>
            </Link>
          </CommandItem_Shadcn_>
        </CommandGroup_Shadcn_>

        <CommandSeparator_Shadcn_ />

        <CommandGroup_Shadcn_>
          <CommandItem_Shadcn_
            className="cursor-pointer w-full"
            onSelect={() => {
              close()
              window?.open(BRANCHING_GITHUB_DISCUSSION_LINK, '_blank')?.focus()
            }}
            onClick={() => close()}
          >
            <a
              target="_blank"
              rel="noreferrer noopener"
              href={BRANCHING_GITHUB_DISCUSSION_LINK}
              onClick={() => close()}
              className="w-full flex gap-2"
            >
              <MessageCircle size={14} strokeWidth={1} className="mt-0.5" />
              <div>
                <p>Branching feedback</p>
                <p className="text-lighter">Join GitHub Discussion</p>
              </div>
            </a>
          </CommandItem_Shadcn_>
        </CommandGroup_Shadcn_>
      </CommandList_Shadcn_>
    </Command_Shadcn_>
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
