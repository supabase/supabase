'use client'

import { useBranchesQuery } from 'data/branches/branches-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'
import { GitBranch } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Badge,
  Button,
  Command_Shadcn_,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'

import { useV2Params } from '@/app/v2/V2ParamsContext'

export function V2BranchSelector() {
  const router = useRouter()
  const { orgSlug, projectRef } = useV2Params()
  const [open, setOpen] = useState(false)

  const { data: project } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )
  const parentRef = project?.parent_project_ref ?? projectRef
  const { data: branches } = useBranchesQuery(
    { projectRef: parentRef },
    { enabled: open && IS_PLATFORM && Boolean(parentRef) }
  )

  const selectedBranch = branches?.find((b) => b.project_ref === projectRef)
  const branchName = selectedBranch?.name ?? 'main'
  const isDefault = selectedBranch?.is_default ?? true

  const handleSelectBranch = (ref: string) => {
    if (!orgSlug) return
    setOpen(false)
    router.push(`/v2/project/${ref}/data/tables`)
  }

  const handleManageBranches = () => {
    if (!orgSlug || !projectRef) return
    setOpen(false)
    router.push(`/v2/project/${projectRef}/settings/branches`)
  }

  if (!IS_PLATFORM) {
    return (
      <span className="text-foreground-lighter text-xs flex items-center gap-1">
        <GitBranch className="h-3 w-3" />
        main
      </span>
    )
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="outline"
          size="tiny"
          className="h-6 gap-1 px-2 rounded-full border-border text-xs"
        >
          <GitBranch className="h-3 w-3" />
          <span>{branchName}</span>
          <Badge
            variant={isDefault ? 'default' : 'secondary'}
            className="text-[10px] px-1 py-0 h-4"
          >
            {isDefault ? 'prod' : 'preview'}
          </Badge>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-[220px] p-0" align="start">
        <Command_Shadcn_>
          <CommandList_Shadcn_>
            <CommandGroup_Shadcn_ heading="Branches">
              {branches?.map((branch) => (
                <CommandItem_Shadcn_
                  key={branch.id}
                  onSelect={() => handleSelectBranch(branch.project_ref)}
                >
                  <GitBranch className="h-3 w-3 mr-2" />
                  {branch.name}
                  {branch.is_default && (
                    <Badge variant="default" className="ml-auto text-[10px]">
                      prod
                    </Badge>
                  )}
                </CommandItem_Shadcn_>
              ))}
            </CommandGroup_Shadcn_>
            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_ onSelect={handleManageBranches}>
                Manage branches
              </CommandItem_Shadcn_>
              <CommandItem_Shadcn_
                onSelect={() => {
                  setOpen(false)
                  // Create branch - could open modal; for now navigate to branches
                  handleManageBranches()
                }}
              >
                + Create branch
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
