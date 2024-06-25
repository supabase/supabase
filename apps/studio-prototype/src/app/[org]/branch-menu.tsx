'use client'

import { orgs } from '@/src/config/org'
import { useConfig } from '@/src/hooks/use-config'
import { resolveHideBranchesDropdown, resolveHideProjectsDropdown } from '@/src/utils/url-resolver'
import { Check, ChevronsUpDown, GitBranch, Shield } from 'lucide-react'
import { usePathname } from 'next/navigation'

import * as React from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import {
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  cn,
} from 'ui'

export function BranchMenu() {
  const [config] = useConfig()
  const pathName = usePathname()
  const { selectedOrg, selectedProject, selectedEnv } = config
  const [projectFocus, setProjectFocusState] = React.useState<string | null>(null)

  const [openProject, setOpenProjectState] = React.useState(false)
  const [openBranch, setOpenBranchState] = React.useState(false)
  const [value, setValue] = React.useState('')

  const projects = selectedOrg?.projects || []
  const branches = selectedProject?.branches || []
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
              'w-[180px] justify-between',
              'rounded-l-none',
              'left-0',
              'opacity-100',
              hideBranchesDropdown ? '-left-[180px] opacity-0' : 'delay-500',
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
                  <IconHandler icon={selectedEnv?.type} />
                  {selectedEnv?.name}
                </>
              ) : (
                <>
                  <IconHandler icon={'preview'} />
                  <span className="text-foreground-lighter">Branching not enabled</span>
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
    </>
  )
}

const IconHandler = (props: { icon: string }) => {
  switch (props.icon) {
    case 'prod':
      return <Shield className="text-warning" size={14} />
    case 'preview':
      return <GitBranch className="text-foreground-muted" size={14} />
    case 'long-running':
      return <GitBranch className="text-foreground-muted" size={14} />
    case 'project':
      return (
        <svg
          className="w-[16px] h-[16px] text-foreground-muted stroke-foreground-lighter"
          width="22"
          height="21"
          viewBox="0 0 22 21"
          fill="none"
          strokeWidth={1}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9.97796 18.9666L12.3138 14.9208C12.416 14.7433 12.4698 14.5421 12.4697 14.3373C12.4696 14.1325 12.4156 13.9313 12.3132 13.7539L9.94105 9.68715C9.83854 9.5096 9.69111 9.36217 9.51356 9.25966C9.33601 9.15715 9.13461 9.10319 8.9296 9.10319L4.2216 9.08223C4.01679 9.08223 3.81558 9.13608 3.63816 9.2384C3.46074 9.34071 3.31334 9.48788 3.21075 9.66515L0.874907 13.711C0.772684 13.8884 0.718929 14.0897 0.719034 14.2945C0.719139 14.4993 0.773101 14.7005 0.875506 14.8778L3.24766 18.9446C3.35017 19.1221 3.4976 19.2696 3.67515 19.3721C3.85269 19.4746 4.0541 19.5286 4.25911 19.5286L8.96711 19.5495C9.17192 19.5495 9.37313 19.4957 9.55055 19.3934C9.72797 19.291 9.87537 19.1439 9.97796 18.9666Z"
            fill="#282828"
            stroke="inherit"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path d="M3.64966 9.24414L6.59462 14.3159L12.4594 14.3304" fill="#282828" />
          <path
            d="M3.64966 9.24414L6.59462 14.3159L12.4594 14.3304"
            stroke="inherit"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M3.67443 19.3737L6.59424 14.3164"
            stroke="inherit"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M14.3846 11.3348L16.7204 7.28896C16.8226 7.11149 16.8764 6.91025 16.8763 6.70544C16.8762 6.50063 16.8222 6.29945 16.7198 6.12208L14.3477 2.05531C14.2452 1.87777 14.0977 1.73033 13.9202 1.62782C13.7426 1.52532 13.5412 1.47135 13.3362 1.47135L8.62822 1.45039C8.42341 1.45039 8.2222 1.50425 8.04478 1.60656C7.86735 1.70888 7.71995 1.85605 7.61737 2.03331L5.28152 6.07911C5.1793 6.25659 5.12555 6.45783 5.12565 6.66264C5.12576 6.86745 5.17972 7.06863 5.28212 7.246L7.65428 11.3128C7.75678 11.4903 7.90422 11.6377 8.08176 11.7403C8.25931 11.8428 8.46071 11.8967 8.66573 11.8967L13.3737 11.9177C13.5785 11.9177 13.7797 11.8638 13.9572 11.7615C14.1346 11.6592 14.282 11.512 14.3846 11.3348Z"
            fill="#282828"
            stroke="inherit"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path d="M8.05737 1.61133L11.0023 6.6831L16.8671 6.69763" fill="#282828" />
          <path
            d="M8.05737 1.61133L11.0023 6.6831L16.8671 6.69763"
            stroke="inherit"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M18.7891 18.9646L21.125 14.9188C21.2272 14.7414 21.2809 14.5401 21.2808 14.3353C21.2807 14.1305 21.2268 13.9293 21.1244 13.752L18.7522 9.6852C18.6497 9.50765 18.5023 9.36021 18.3247 9.25771C18.1472 9.1552 17.9458 9.10124 17.7408 9.10124L13.0328 9.08027C12.828 9.08027 12.6267 9.13413 12.4493 9.23644C12.2719 9.33876 12.1245 9.48593 12.0219 9.6632L9.68606 13.709C9.58384 13.8865 9.53009 14.0877 9.53019 14.2925C9.5303 14.4973 9.58426 14.6985 9.68666 14.8759L12.0588 18.9426C12.1613 19.1202 12.3088 19.2676 12.4863 19.3701C12.6639 19.4726 12.8653 19.5266 13.0703 19.5266L17.7783 19.5476C17.9831 19.5476 18.1843 19.4937 18.3617 19.3914C18.5391 19.2891 18.6865 19.1419 18.7891 18.9646Z"
            fill="#282828"
            stroke="inherit"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M12.4866 19.3707L15.4064 14.3135"
            stroke="inherit"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path d="M12.4619 9.24219L15.4069 14.314L21.2716 14.3285" fill="#282828" />
          <path
            d="M12.4619 9.24219L15.4069 14.314L21.2716 14.3285"
            stroke="inherit"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M10.9515 12.2796L9.40422 12.3352C9.08131 12.6071 9.24551 13.1598 9.20538 13.1745C9.16525 13.1893 7.99516 16.7534 7.41513 18.5336L9.32951 19.228L9.87709 18.6354L11.8117 15.3667L12.2858 14.1075L10.9515 12.2796Z"
            fill="#282828"
          />
          <path
            d="M8.96709 19.5489C9.1719 19.5489 9.37311 19.4951 9.55053 19.3928C9.72795 19.2904 9.87536 19.1433 9.97794 18.966L12.3138 14.9202C12.416 14.7427 12.4698 14.5415 12.4697 14.3367C12.4696 14.1319 12.4156 13.9307 12.3132 13.7533L11.0907 11.6387"
            stroke="inherit"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M3.64966 9.24414L3.74587 9.39626L6.59462 14.3159L12.4594 14.3304"
            stroke="inherit"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M8.08105 11.7399L11.0009 6.68262"
            stroke="inherit"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      )
    default:
      return null
  }
}

const BranchMenuPopoverContent = (props: {
  id?: string
  setOpenState: (x: boolean) => void
  defaultFocus: 'project' | 'branch'
  hideBranchesDropdown?: boolean
  branchBasedSettings?: boolean
}) => {
  const [config, setConfig] = useConfig()
  const { selectedOrg, selectedProject } = config

  // data
  const projects = selectedOrg?.projects || []
  const branches = selectedProject?.branches || []

  const [projectFocus, setProjectFocusState] = React.useState<string | undefined>(undefined)
  const [isFrameworkInputFocused, setIsFrameworkInputFocused] = React.useState(false)
  const [isBranchInputFocused, setIsBranchInputFocused] = React.useState(false)

  // refs
  const projectInputRef = React.useRef<HTMLInputElement>(null)
  const branchInputRef = React.useRef<HTMLInputElement>(null)

  const _projectFocus = projectFocus || selectedProject?.key // dumb variable needed
  const projectMeta = projects.find((proj) => proj.key === _projectFocus)

  // pick up stray unfocussed state with left and right keys
  useHotkeys(
    'right',
    () => {
      console.log('right was pushed')
      setIsBranchInputFocused(true)
      branchInputRef.current?.focus()
    },
    []
  )

  useHotkeys(
    'left',
    () => {
      setIsFrameworkInputFocused(true)
      projectInputRef.current?.focus()
    },
    []
  )

  return (
    <PopoverContent_Shadcn_
      className={cn('w-[500px] p-0 flex h-full', 'h-96 overflow-hidden')}
      alignOffset={props.defaultFocus === 'project' ? 0 : -178}
      align="start"
      key={props.id}
    >
      <Command_Shadcn_
        onValueChange={(value) => {
          console.log(value)
          console.log('onValueChange')
        }}
        className={cn('border-r border-overlay rounded-none', isBranchInputFocused && 'bg-200/50')}
      >
        <CommandInput_Shadcn_
          autoFocus={props.defaultFocus === 'project'}
          placeholder="Search framework..."
          ref={projectInputRef}
          onFocus={() => setIsFrameworkInputFocused(true)}
          onBlur={() => setIsFrameworkInputFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') {
              setIsBranchInputFocused(true)
              branchInputRef.current?.focus()
            }
          }}
        />
        <CommandEmpty_Shadcn_>No framework found.</CommandEmpty_Shadcn_>
        <CommandGroup_Shadcn_ heading="Projects">
          {projects.map((project) => (
            <CommandItem_Shadcn_
              key={project.key}
              value={project.key}
              onSelect={(currentValue) => {
                setConfig({
                  ...config,
                  selectedProject: selectedOrg?.projects.find((p) => p.key === currentValue),
                  selectedEnv: selectedOrg?.projects?.find((p) => p.key === currentValue)
                    ?.branches[0] ?? {
                    key: 'main',
                    name: 'main',
                    type: 'prod',
                  },
                })
                props.setOpenState(false)
              }}
              onSelectCapture={() => {
                console.log('select capture')
              }}
              className="text-sm justify-between flex cursor-pointer"
              onFocus={() => {
                console.log('focus')
                setProjectFocusState(project.key)
              }}
            >
              <div className="flex gap-2 items-center">
                <IconHandler icon="project" />
                {project.name}
              </div>
              <div
                className={cn(
                  'w-4 h-4 bg-foreground rounded-full',
                  'flex items-center justify-center',
                  project.key === config.project ? 'opacity-100' : 'opacity-0'
                )}
              >
                <Check className={cn('h-2 w-2 text-background')} strokeWidth={5} />
              </div>
            </CommandItem_Shadcn_>
          ))}
        </CommandGroup_Shadcn_>
      </Command_Shadcn_>
      <Command_Shadcn_
        className={cn(
          'border-r border-overlay rounded-none',
          isFrameworkInputFocused && 'bg-200/50'
        )}
      >
        {props.hideBranchesDropdown ? (
          <div className="flex flex-col items-center justify-center mt-10 opacity-50 px-5 text-center">
            <p className="text-xs text-foreground">Branch settings not available</p>
            <p className="text-xs text-foreground-light">
              No branch specific settings available on this page.
            </p>
          </div>
        ) : !projectMeta?.branching ? (
          <div className="flex flex-col items-center justify-center mt-10 px-5 text-center">
            <p className="text-xs text-foreground">Branching not yet enabled</p>
            <p className="text-xs text-foreground-light">Use for safe database migrations</p>

            <Button type="default" className="mt-3">
              Enable Branching
            </Button>
          </div>
        ) : (
          <>
            <CommandInput_Shadcn_
              autoFocus={props.defaultFocus === 'branch'}
              placeholder="Search branch..."
              ref={branchInputRef}
              onFocus={() => setIsBranchInputFocused(true)}
              onBlur={() => setIsBranchInputFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') {
                  setIsFrameworkInputFocused(true)
                  projectInputRef.current?.focus()
                }
              }}
            />
            <CommandEmpty_Shadcn_>No branch found.</CommandEmpty_Shadcn_>
            <CommandGroup_Shadcn_ heading="Branches">
              {branches.map((branch) => (
                <CommandItem_Shadcn_
                  key={branch.key}
                  value={branch.key}
                  onSelect={(currentValue) => {
                    setConfig({
                      ...config,
                      selectedEnv: {
                        key: branches.find((b) => b.key === currentValue)?.key || 'main',
                        name: currentValue,
                        // @ts-expect-error
                        type: branches.find((b) => b.key === currentValue)?.type || 'prod',
                      },
                    })
                    props.setOpenState(false)
                  }}
                  className="text-sm flex gap-2 justify-between cursor-pointer"
                >
                  <div className="flex gap-2 items-center">
                    {branch.type === 'prod' ? (
                      <IconHandler icon="prod" />
                    ) : (
                      <IconHandler icon="preview" />
                    )}
                    {branch.name}
                    <span className="font-mono text-foreground-muted">{branch.type}</span>
                  </div>
                  <div
                    className={cn(
                      'w-4 h-4 bg-foreground rounded-full',
                      'flex items-center justify-center',
                      config?.env?.name === branch.key ? 'opacity-100' : 'opacity-0'
                    )}
                  >
                    <Check className={cn('h-2 w-2 text-background')} strokeWidth={5} />
                  </div>
                </CommandItem_Shadcn_>
              ))}
            </CommandGroup_Shadcn_>
          </>
        )}
      </Command_Shadcn_>
    </PopoverContent_Shadcn_>
  )
}
