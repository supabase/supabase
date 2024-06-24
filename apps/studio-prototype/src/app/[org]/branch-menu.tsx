'use client'

import { orgs } from '@/src/config/org'
import { useConfig } from '@/src/hooks/use-config'
import { Check, ChevronsUpDown } from 'lucide-react'

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
  const { organization, project, env } = config
  const [projectFocus, setProjectFocusState] = React.useState<string | null>(null)

  const [openProject, setOpenProjectState] = React.useState(false)
  const [openBranch, setOpenBranchState] = React.useState(false)
  const [value, setValue] = React.useState('')

  const projects = orgs.find((org) => org.key === organization)?.projects || []

  const branches = projects.find((proj) => proj.key === projectFocus || project)?.branches || []

  return (
    <>
      <Popover_Shadcn_ open={openProject} onOpenChange={setOpenProjectState}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            type="default"
            role="combobox"
            size={'tiny'}
            aria-expanded={openProject}
            className={cn('w-[200px] justify-between', 'rounded-r-none')}
            iconRight={<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
          >
            {project}
          </Button>
        </PopoverTrigger_Shadcn_>
        <BranchMenuPopoverContent id={'project-version-version-content'} />
      </Popover_Shadcn_>
      <Popover_Shadcn_ open={openBranch} onOpenChange={setOpenBranchState}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            type="default"
            role="combobox"
            size={'tiny'}
            aria-expanded={openBranch}
            className={cn('w-[200px] justify-between', 'rounded-l-none')}
            iconRight={<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
          >
            {env?.name}
          </Button>
        </PopoverTrigger_Shadcn_>
        <BranchMenuPopoverContent id={'branch-version-content'} />
      </Popover_Shadcn_>
    </>
  )
}

const BranchMenuPopoverContent = (props: { id?: string }) => {
  const [config, setConfig] = useConfig()
  const { organization, project } = config
  const [projectFocus, setProjectFocusState] = React.useState<string | null>(null)
  const [isFrameworkInputFocused, setIsFrameworkInputFocused] = React.useState(false)
  const [isBranchInputFocused, setIsBranchInputFocused] = React.useState(false)

  // data
  const projects = orgs.find((org) => org.key === organization)?.projects || []
  const branches = projects.find((proj) => proj.key === project)?.branches || []

  // refs
  const projectInputRef = React.useRef<HTMLInputElement>(null)
  const branchInputRef = React.useRef<HTMLInputElement>(null)

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
      className={cn('w-[500px] p-0 flex h-full', 'h-96')}
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
                  project: currentValue,
                })
              }}
              onSelectCapture={() => {
                console.log('select capture')
              }}
              className="text-sm justify-between flex"
              onFocus={() => {
                console.log('focus')
                setProjectFocusState(project.key)
              }}
            >
              {project.name}

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
        <CommandInput_Shadcn_
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
                // setValue(currentValue === value ? '' : currentValue)
                // setOpen(false)
              }}
              className="text-sm flex gap-2"
            >
              {branch.name}
              <span className="font-mono text-foreground-muted">{branch.type}</span>
              <Check
                className={cn(
                  'mr-2 h-4 w-4',
                  config?.env?.name === branch.key ? 'opacity-100' : 'opacity-0'
                )}
              />
            </CommandItem_Shadcn_>
          ))}
        </CommandGroup_Shadcn_>
      </Command_Shadcn_>
    </PopoverContent_Shadcn_>
  )
}
