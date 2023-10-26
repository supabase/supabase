import { ListTree } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { Branch, useBranchesQuery } from 'data/branches/branches-query'
import { useSelectedProject } from 'hooks'
import {
  Badge,
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  IconAlertCircle,
  IconCheck,
  IconCode,
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
        value={branch.name}
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
        {isSelected && <IconCheck />}
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

  return (
    <>
      {isLoading && <ShimmeringLoader className="w-[90px]" />}

      {isError && (
        <div className="flex items-center space-x-2 text-amber-900">
          <IconAlertCircle size={16} strokeWidth={2} />
          <p className="text-sm">Failed to load branches</p>
        </div>
      )}

      {isSuccess && branches.length > 0 && (
        <div className="flex items-center px-2">
          <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger_Shadcn_ asChild>
              <Button
                type="text"
                className="pr-2"
                iconRight={
                  <IconCode className="text-foreground-light rotate-90" strokeWidth={2} size={12} />
                }
              >
                <div className="flex items-center space-x-2">
                  <p className={isNewNav ? 'text-sm' : 'text-xs'}>{selectedBranch?.name}</p>
                  {selectedBranch?.is_default ? (
                    <Badge color="amber">Production</Badge>
                  ) : (
                    <Badge color="green">Preview Branch</Badge>
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
                  <CommandGroup_Shadcn_ className="border-t">
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
