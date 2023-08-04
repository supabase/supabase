import Link from 'next/link'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'

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
  IconGitBranch,
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
        asChild
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
        <a>
          {branch.name}
          {isSelected && <IconCheck />}
        </a>
      </CommandItem_Shadcn_>
    </Link>
  )
}

const BranchDropdown = () => {
  const router = useRouter()
  const { ref } = useParams()
  const projectDetails = useSelectedProject()
  const branchNameRef = useRef<HTMLAnchorElement>(null)

  const isBranch = projectDetails?.parent_project_ref !== undefined
  const projectRef =
    projectDetails !== undefined ? (isBranch ? projectDetails.parent_project_ref : ref) : undefined
  const { data: branches, isLoading, isError, isSuccess } = useBranchesQuery({ projectRef })

  const [open, setOpen] = useState(false)
  const popoverOffset = (branchNameRef.current?.offsetWidth ?? 0) + 12
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
        <div className="flex items-center space-x-2 px-2">
          <Link passHref href={`/project/${ref}`}>
            <a ref={branchNameRef} className="flex items-center space-x-2 text-sm">
              {selectedBranch?.name}
            </a>
          </Link>

          <Link passHref href={`/project/${ref}/branches`}>
            <a ref={branchNameRef} className="flex items-center space-x-2">
              {selectedBranch?.is_default ? (
                <Badge color="amber">Production</Badge>
              ) : (
                <Badge color="green">Preview Branch</Badge>
              )}
            </a>
          </Link>

          <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger_Shadcn_ asChild>
              <Button
                type="text"
                className="px-1"
                icon={<IconCode className="text-scale-1100 rotate-90" strokeWidth={2} size={12} />}
              />
            </PopoverTrigger_Shadcn_>
            <PopoverContent_Shadcn_
              className="p-0"
              side="bottom"
              align="start"
              style={{ marginLeft: `-${popoverOffset}px` }}
            >
              <Command_Shadcn_>
                <CommandInput_Shadcn_ placeholder="Find branch..." />
                <CommandList_Shadcn_>
                  <CommandEmpty_Shadcn_>No branches found</CommandEmpty_Shadcn_>
                  <CommandGroup_Shadcn_>
                    <ScrollArea className={(branches || []).length > 7 ? 'h-[210px]' : ''}>
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
                    <Link passHref href={`/project/${ref}/branches`}>
                      <CommandItem_Shadcn_
                        asChild
                        className="cursor-pointer flex items-center space-x-2 w-full"
                        onSelect={(e) => {
                          setOpen(false)
                          router.push(`/project/${ref}/branches`)
                        }}
                        onClick={() => setOpen(false)}
                      >
                        <a>
                          <IconGitBranch size={14} strokeWidth={1.5} />
                          <p>Manage branches</p>
                        </a>
                      </CommandItem_Shadcn_>
                    </Link>
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
