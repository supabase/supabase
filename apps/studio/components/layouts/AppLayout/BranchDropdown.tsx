import { useParams } from 'common'
import { Branch, useBranchesQuery } from 'data/branches/branches-query'
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
  setOpen,
}: {
  branch: Branch
  isSelected: boolean
  setOpen: (value: boolean) => void
}) => {
  const router = useRouter()
  const sanitizedRoute = sanitizeRoute(router.route, router.query)
  const href =
    sanitizedRoute?.replace('[ref]', branch.project_ref) ?? `/project/${branch.project_ref}`

  return (
    <Link passHref href={href}>
      <CommandItem_Shadcn_
        value={branch.name.replaceAll('"', '')}
        className="cursor-pointer w-full flex items-center justify-between"
        onSelect={() => {
          setOpen(false)
          router.push(href)
        }}
        onClick={() => {
          setOpen(false)
        }}
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

export const BranchDropdown = () => {
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

  return (
    <>
      {isLoading && <ShimmeringLoader className="w-[90px]" />}

      {isError && (
        <div className="flex items-center space-x-2 text-amber-900">
          <AlertCircle size={16} strokeWidth={2} />
          <p className="text-sm">Failed to load branches</p>
        </div>
      )}

      {isSuccess && (
        <>
          <Link href={`/project/${ref}`} className="flex items-center gap-2 flex-shrink-0 ">
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
                size="tiny"
                className={cn('px-1.5 py-4 [&_svg]:w-5 [&_svg]:h-5 ml-1')}
                iconRight={<ChevronsUpDown strokeWidth={1.5} />}
              />
            </PopoverTrigger_Shadcn_>
            <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
              <Command_Shadcn_>
                {isBranchingEnabled && <CommandInput_Shadcn_ placeholder="Find branch..." />}
                <CommandList_Shadcn_>
                  {isBranchingEnabled && (
                    <CommandEmpty_Shadcn_>No branches found</CommandEmpty_Shadcn_>
                  )}

                  <CommandGroup_Shadcn_>
                    <ScrollArea className="max-h-[210px] overflow-y-auto">
                      {branchList.map((branch) => (
                        <BranchLink
                          key={branch.id}
                          branch={branch}
                          isSelected={branch.id === selectedBranch?.id || branches?.length === 0}
                          setOpen={setOpen}
                        />
                      ))}
                    </ScrollArea>
                  </CommandGroup_Shadcn_>

                  <CommandSeparator_Shadcn_ />

                  <CommandGroup_Shadcn_>
                    <CommandItem_Shadcn_
                      className="cursor-pointer w-full"
                      onSelect={() => {
                        setOpen(false)
                        snap.setShowCreateBranchModal(true)
                      }}
                      onClick={() => {
                        setOpen(false)
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
                        setOpen(false)
                        router.push(`/project/${ref}/branches`)
                      }}
                      onClick={() => setOpen(false)}
                    >
                      <Link
                        href={`/project/${ref}/branches`}
                        className="w-full flex items-center gap-2"
                      >
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
                        setOpen(false)
                        window?.open(BRANCHING_GITHUB_DISCUSSION_LINK, '_blank')?.focus()
                      }}
                      onClick={() => setOpen(false)}
                    >
                      <a
                        target="_blank"
                        rel="noreferrer noopener"
                        href={BRANCHING_GITHUB_DISCUSSION_LINK}
                        onClick={() => setOpen(false)}
                        className="w-full flex gap-2"
                      >
                        <MessageCircle size={14} strokeWidth={1} className="text-muted mt-0.5" />
                        <div>
                          <p>Branching feedback</p>
                          <p className="text-lighter">Join GitHub Discussion</p>
                        </div>
                      </a>
                    </CommandItem_Shadcn_>
                  </CommandGroup_Shadcn_>
                </CommandList_Shadcn_>
              </Command_Shadcn_>
            </PopoverContent_Shadcn_>
          </Popover_Shadcn_>
        </>
      )}
    </>
  )
}
