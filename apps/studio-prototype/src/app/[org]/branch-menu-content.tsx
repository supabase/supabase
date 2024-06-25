import { useConfig } from '@/src/hooks/use-config'
import { Check, PlusCircle } from 'lucide-react'

import * as React from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import {
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandSeparator_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  cn,
} from 'ui'
import EnableBranchingDialog from './enable-branching-dialog'
import { IconHandler } from './icon-handler'

export const BranchMenuPopoverContent = (props: {
  id?: string
  setOpenState: (x: boolean) => void
  defaultFocus: 'project' | 'branch'
  hideBranchesDropdown?: boolean
  branchBasedSettings?: boolean
}) => {
  const [config, setConfig] = useConfig()
  const { selectedOrg, selectedProject, selectedEnv, settingsAllPreviews } = config

  // data
  const projects = selectedOrg?.projects || []
  const branches = selectedProject?.branches || []

  const [projectFocus, setProjectFocusState] = React.useState<string | undefined>(undefined)
  const [isFrameworkInputFocused, setIsFrameworkInputFocused] = React.useState(false)
  const [isBranchInputFocused, setIsBranchInputFocused] = React.useState(false)

  // refs
  const projectInputRef = React.useRef<HTMLInputElement>(null)
  const branchInputRef = React.useRef<HTMLInputElement>(null)

  const _projectFocus = selectedProject?.key // dumb variable needed
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

  const isAllPreviewBranches =
    props.branchBasedSettings &&
    selectedEnv?.key !== 'main' &&
    !branches
      .filter((x) => x.settings)
      .map((b) => b.key)
      .includes(selectedEnv?.key)

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
          placeholder="Search projects..."
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
                const project = selectedOrg?.projects.find((p) => p.key === currentValue)
                setConfig({
                  ...config,
                  selectedProject: project,
                  selectedEnv: (project?.branches && project?.branches[0]) ?? {
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
              className={cn('text-sm justify-between flex cursor-pointer')}
              onFocus={() => {
                console.log('focus')
                setProjectFocusState(project.key)
              }}
            >
              <div className="flex gap-2 items-center">
                <IconHandler
                  icon="project"
                  className={cn(selectedProject?.key === project.key && 'text-foreground')}
                />
                {project.name}
              </div>
              <div
                className={cn(
                  'w-4 h-4 bg-foreground rounded-full',
                  'flex items-center justify-center',
                  selectedProject?.key === project.key ? 'opacity-100' : 'opacity-0'
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
            <p className="text-xs text-foreground-light mb-3">Use for safe database migrations</p>
            <EnableBranchingDialog />
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
            {props.branchBasedSettings && (
              <>
                <CommandGroup_Shadcn_>
                  <CommandItem_Shadcn_
                    onSelect={() => {
                      setConfig({
                        ...config,
                        settingsAllPreviews: true,
                      })
                      props.setOpenState(false)
                    }}
                  >
                    <div className="flex gap-2 items-center justify-start grow">
                      <IconHandler icon="preview" />
                      <div className="flex flex-col gap-0">
                        All Preview Branches
                        <p className="text-xs text-foreground-lighter">Settings for all branches</p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'w-4 h-4 bg-foreground rounded-full',
                        'flex items-center justify-center',
                        settingsAllPreviews || isAllPreviewBranches ? 'opacity-100' : 'opacity-0'
                      )}
                    >
                      <Check className={cn('h-2 w-2 text-background')} strokeWidth={5} />
                    </div>
                  </CommandItem_Shadcn_>
                </CommandGroup_Shadcn_>
                <CommandSeparator_Shadcn_ />
              </>
            )}
            <div className="grow">
              <CommandGroup_Shadcn_ heading="Branches">
                {branches
                  .filter((x) => x.settings || x.type === 'prod')
                  .map((branch) => (
                    <CommandItem_Shadcn_
                      key={branch.key}
                      value={branch.key}
                      onSelect={(currentValue) => {
                        setConfig({
                          ...config,
                          settingsAllPreviews: false,
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
                          !settingsAllPreviews && selectedEnv?.key === branch.key
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      >
                        <Check className={cn('h-2 w-2 text-background')} strokeWidth={5} />
                      </div>
                    </CommandItem_Shadcn_>
                  ))}
              </CommandGroup_Shadcn_>
            </div>
            <CommandSeparator_Shadcn_ />
            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_ className="flex gap-2">
                <PlusCircle size={16} className="text-foreground-muted" strokeWidth={2} />
                Create Preview Branch
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </>
        )}
      </Command_Shadcn_>
    </PopoverContent_Shadcn_>
  )
}
