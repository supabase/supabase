import { AlertCircle, Check, ChevronsUpDown, ListTree, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { Branch, useBranchesQuery } from 'data/branches/branches-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import {
  Badge,
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
} from 'ui'
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
        <p className="truncate w-60" title={branch.name}>
          {branch.name}
        </p>
        {isSelected && <Check />}
      </CommandItem_Shadcn_>
    </Link>
  )
}

interface BranchDropdownProps {
  isNewNav?: boolean
}

const BranchDropdown = ({ isNewNav = false }: BranchDropdownProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const projectDetails = useSelectedProject()

  const isBranch = projectDetails?.parent_project_ref !== undefined
  const projectRef =
    projectDetails !== undefined ? (isBranch ? projectDetails.parent_project_ref : ref) : undefined
  const { data: branches, isLoading, isError, isSuccess } = useBranchesQuery({ projectRef })

  const [open, setOpen] = useState(false)
  const selectedBranch = branches?.find((branch) => branch.project_ref === ref)

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

      {isSuccess && branches.length > 0 && (
        <div className="flex items-center px-2">
          <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger_Shadcn_ asChild>
              <Button type="text" className="pr-2" iconRight={<ChevronsUpDown />}>
                <div className="flex items-center space-x-2">
                  <p className={isNewNav ? 'text-sm' : 'text-xs'}>{selectedBranch?.name}</p>
                  {selectedBranch?.is_default ? (
                    <Badge variant="warning">Production</Badge>
                  ) : (
                    <Badge variant="brand">Preview Branch</Badge>
                  )}
                </div>
              </Button>
            </PopoverTrigger_Shadcn_>
            <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
              <Command_Shadcn_>
                <CommandInput_Shadcn_ placeholder="Find branch..." />
                <CommandList_Shadcn_>
                  <CommandEmpty_Shadcn_>No branches found</CommandEmpty_Shadcn_>
                  <CommandGroup_Shadcn_>
                    <ScrollArea className="max-h-[210px] overflow-y-auto">
                      {branches?.map((branch) => (
                        <BranchLink
                          key={branch.id}
                          branch={branch}
                          isSelected={branch.id === selectedBranch?.id}
                          setOpen={setOpen}
                        />
                      ))}
                    </ScrollArea>
                  </CommandGroup_Shadcn_>
                  <CommandSeparator_Shadcn_ />
                  <CommandGroup_Shadcn_>
                    <CommandItem_Shadcn_
                      className="cursor-pointer w-full"
                      onSelect={(e) => {
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
                      <Link
                        href={BRANCHING_GITHUB_DISCUSSION_LINK}
                        target="_blank"
                        onClick={() => {
                          setOpen(false)
                        }}
                        className="w-full flex gap-2"
                      >
                        <MessageCircle size={14} strokeWidth={1} className="text-muted mt-0.5" />
                        <div>
                          <p>Branching feedback</p>
                          <p className="text-lighter">Join Github Discussion</p>
                        </div>
                      </Link>
                    </CommandItem_Shadcn_>
                  </CommandGroup_Shadcn_>
                </CommandList_Shadcn_>
              </Command_Shadcn_>
            </PopoverContent_Shadcn_>
          </Popover_Shadcn_>
        </div>
      )}
    </>
  )
}

export default BranchDropdown
