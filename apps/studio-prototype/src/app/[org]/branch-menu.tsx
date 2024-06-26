'use client'

import { useConfig } from '@/src/hooks/use-config'
import { resolveHideBranchesDropdown, resolveHideProjectsDropdown } from '@/src/utils/url-resolver'
import { ChevronsUpDown, Plug, Plug2 } from 'lucide-react'
import { usePathname } from 'next/navigation'

import * as React from 'react'
import { Button, PopoverTrigger_Shadcn_, Popover_Shadcn_, cn } from 'ui'
import { IconHandler } from './icon-handler'
import { BranchMenuPopoverContent } from './branch-menu-content'

export function BranchMenu() {
  const [config] = useConfig()
  const pathName = usePathname()
  const { selectedOrg, selectedProject, selectedEnv, settingsAllPreviews } = config
  const [projectFocus, setProjectFocusState] = React.useState<string | null>(null)

  const [openProject, setOpenProjectState] = React.useState(false)
  const [openBranch, setOpenBranchState] = React.useState(false)
  const [value, setValue] = React.useState('')

  const projectMeta = selectedProject

  const hideBranchesDropdown = resolveHideBranchesDropdown(
    pathName,
    selectedOrg?.key,
    selectedProject?.key
  )

  const hideProjectsDropdown = resolveHideProjectsDropdown(
    pathName,
    selectedOrg?.key,
    selectedProject?.key
  )

  const branchBasedSettings =
    !hideBranchesDropdown && pathName.startsWith(`/${selectedOrg?.key}/settings/project`)

  const showSettingsAllPreviews =
    pathName.startsWith(`/${selectedOrg?.key}/settings/`) && settingsAllPreviews

  return (
    <>
      <Popover_Shadcn_ open={openProject} onOpenChange={setOpenProjectState}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            type="default"
            role="combobox"
            size={'tiny'}
            aria-expanded={openProject}
            className={cn(
              'px-2',
              'z-10 w-[180px] justify-between',
              !hideBranchesDropdown && 'rounded-r-none',
              'left-0',
              'opacity-100',
              hideProjectsDropdown && '-left-[8px] opacity-0',
              'transition-all duration-200 ease-out'
            )}
            iconRight={<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
          >
            <div className="flex gap-2 items-center">
              <IconHandler icon="project" />
              {selectedProject?.name}
            </div>
          </Button>
        </PopoverTrigger_Shadcn_>
        <BranchMenuPopoverContent
          id={'project-version-version-content'}
          setOpenState={setOpenProjectState}
          defaultFocus={'project'}
          hideBranchesDropdown={hideBranchesDropdown}
          branchBasedSettings={branchBasedSettings}
        />
      </Popover_Shadcn_>
      <Popover_Shadcn_ open={openBranch} onOpenChange={setOpenBranchState}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            type={projectMeta?.branching ? 'default' : 'outline'}
            role="combobox"
            size={'tiny'}
            aria-expanded={openBranch}
            className={cn(
              'px-2',
              'justify-between',
              'rounded-l-none',
              'left-0',
              'opacity-100',
              hideBranchesDropdown ? '-left-[8px] opacity-0 w-0 px-0' : 'delay-500',
              'transition-all duration-200 ease-out'
            )}
            iconRight={
              projectMeta?.branching && (
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              )
            }
          >
            <div className="flex gap-2 items-center">
              {projectMeta?.branching ? (
                <>
                  <IconHandler icon={showSettingsAllPreviews ? 'preview' : selectedEnv?.type} />
                  {showSettingsAllPreviews ? 'All preview branches' : selectedEnv?.name}
                </>
              ) : (
                <>
                  <IconHandler icon={'preview'} />
                  <span className="text-foreground-lighter pr-1">Branching not enabled</span>
                </>
              )}
            </div>
          </Button>
        </PopoverTrigger_Shadcn_>
        <BranchMenuPopoverContent
          id={'branch-version-content'}
          setOpenState={setOpenBranchState}
          defaultFocus={'branch'}
          hideBranchesDropdown={hideBranchesDropdown}
          branchBasedSettings={branchBasedSettings}
        />
      </Popover_Shadcn_>

      <div>
        <Button
          type="outline"
          className={cn(
            'ml-3 rounded-full bg-opacity-50 text-foreground-lighter',
            hideProjectsDropdown
              ? '-left-[8px] opacity-0'
              : // animate in slow
                'delay-1000'
          )}
          icon={<Plug className="rotate-90" />}
        >
          Connect
        </Button>
      </div>
    </>
  )
}
