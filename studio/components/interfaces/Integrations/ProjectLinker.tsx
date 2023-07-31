import { ReactNode, useRef, useState } from 'react'

import { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { IntegrationConnectionsCreateVariables } from 'data/integrations/types'
import { useSelectedOrganization } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import {
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  IconChevronDown,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  cn,
} from 'ui'

export interface Project {
  id: string
  name: string
  ref: string
}

export interface ForeignProject {
  id: string
  name: string
}

export interface ProjectLinkerProps {
  organizationIntegrationId: string | undefined
  foreignProjects: ForeignProject[]
  supabaseProjects: Project[]
  onCreateConnections: (variables: IntegrationConnectionsCreateVariables) => void
  installedConnections: IntegrationProjectConnection[] | undefined
  isLoading?: boolean
  integrationIcon: ReactNode
  getForeignProjectIcon?: (project: ForeignProject) => ReactNode
  choosePrompt?: string
  onSkip?: () => void
  loadingForeignProjects?: boolean
  loadingSupabaseProjects?: boolean
}

const ProjectLinker = ({
  organizationIntegrationId,
  foreignProjects,
  supabaseProjects,
  onCreateConnections: _onCreateConnections,
  installedConnections = [],
  isLoading,
  integrationIcon,
  getForeignProjectIcon,
  choosePrompt = 'Choose a project',
  onSkip,
  loadingForeignProjects,
  loadingSupabaseProjects,
}: ProjectLinkerProps) => {
  const [supabaseProjectsComboBoxOpen, setSupabaseProjectsComboboxOpen] = useState(false)
  const [foreignProjectsComboBoxOpen, setForeignProjectsComboboxOpen] = useState(false)
  const supabaseProjectsComboBoxRef = useRef<HTMLButtonElement>(null)
  const foreignProjectsComboBoxRef = useRef<HTMLButtonElement>(null)

  const selectedOrganization = useSelectedOrganization()

  const [supabaseProjectRef, setSupabaseProjectRef] = useState<string | undefined>(undefined)
  const [foreignProjectId, setForeignProjectId] = useState<string | undefined>(undefined)

  // create a flat array of foreign project ids. ie, ["prj_MlkO6AiLG5ofS9ojKrkS3PhhlY3f", ..]
  const flatInstalledConnectionsIds = new Set(installedConnections.map((x) => x.foreign_project_id))

  // check that foreign project is not already installed
  const filteredForeignProjects = foreignProjects.filter((foreignProject) => {
    return !flatInstalledConnectionsIds.has(foreignProject.id)
  })

  const selectedSupabaseProject = supabaseProjectRef
    ? supabaseProjects.find((x) => x.ref?.toLowerCase() === supabaseProjectRef?.toLowerCase())
    : undefined

  const selectedForeignProject = foreignProjectId
    ? filteredForeignProjects.find((x) => x.id?.toLowerCase() === foreignProjectId?.toLowerCase())
    : undefined

  function onCreateConnections() {
    const projectDetails = selectedForeignProject

    if (!organizationIntegrationId) return console.error('No integration ID set')
    if (!selectedForeignProject?.id) return console.error('No Foreign project ID set')
    if (!selectedSupabaseProject?.ref) return console.error('No Supabase project ref set')

    _onCreateConnections({
      organizationIntegrationId,
      connection: {
        foreign_project_id: selectedForeignProject?.id,
        supabase_project_ref: selectedSupabaseProject?.ref,
        metadata: {
          ...projectDetails,
        },
      },
      orgSlug: selectedOrganization?.slug,
    })
  }

  const Panel = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
      <div
        className={cn(
          'flex flex-col grow gap-6 px-5 mx-auto w-full justify-center items-center',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative border rounded-lg p-12 bg shadow">
        <div
          className="absolute inset-0 bg-grid-black/5 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-white/5 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"
          style={{ backgroundPosition: '10px 10px' }}
        ></div>
        <div className="flex gap-0 w-full relative">
          <Panel>
            <div className="bg-white shadow border rounded p-1 w-12 h-12 flex justify-center items-center">
              <img src={`${BASE_PATH}/img/supabase-logo.svg`} alt="Supabase" className="w-6" />
            </div>

            <Popover_Shadcn_
              open={supabaseProjectsComboBoxOpen}
              onOpenChange={setSupabaseProjectsComboboxOpen}
            >
              <PopoverTrigger_Shadcn_ asChild>
                <Button
                  ref={supabaseProjectsComboBoxRef}
                  type="default"
                  size="medium"
                  block
                  disabled={loadingSupabaseProjects}
                  loading={loadingSupabaseProjects}
                  className="justify-start"
                  icon={
                    <div className="bg-white shadow border rounded p-1 w-6 h-6 flex justify-center items-center">
                      <img
                        src={`${BASE_PATH}/img/supabase-logo.svg`}
                        alt="Supabase"
                        className="w-4"
                      />
                    </div>
                  }
                  iconRight={
                    <span className="grow flex justify-end">
                      <IconChevronDown className={''} />
                    </span>
                  }
                >
                  {selectedSupabaseProject ? selectedSupabaseProject.name : 'Choose Project'}
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_
                className="p-0 w-full"
                side="bottom"
                align="center"
                style={{ width: supabaseProjectsComboBoxRef.current?.offsetWidth }}
              >
                <Command_Shadcn_>
                  <CommandInput_Shadcn_ placeholder="Search organization..." />
                  <CommandList_Shadcn_ className="!max-h-[170px]">
                    <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
                    <CommandGroup_Shadcn_>
                      {supabaseProjects.map((project) => {
                        return (
                          <CommandItem_Shadcn_
                            value={project.ref}
                            key={project.ref}
                            className="flex gap-2 items-center"
                            onSelect={(ref) => {
                              if (ref) setSupabaseProjectRef(ref)
                              setSupabaseProjectsComboboxOpen(false)
                            }}
                          >
                            <div className="bg-white shadow border rounded p-1 w-6 h-6 flex justify-center items-center">
                              <img
                                src={`${BASE_PATH}/img/supabase-logo.svg`}
                                alt="Supabase"
                                className="w-4"
                              />
                            </div>
                            <span>{project.name}</span>
                          </CommandItem_Shadcn_>
                        )
                      })}
                    </CommandGroup_Shadcn_>
                  </CommandList_Shadcn_>
                </Command_Shadcn_>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          </Panel>
          <div className="border border-scale-1000 h-px w-16 border-dashed self-end mb-5"></div>
          <Panel>
            <div className="bg-black shadow rounded p-1 w-12 h-12 flex justify-center items-center">
              {integrationIcon}
            </div>

            <Popover_Shadcn_
              open={foreignProjectsComboBoxOpen}
              onOpenChange={setForeignProjectsComboboxOpen}
            >
              <PopoverTrigger_Shadcn_ asChild>
                <Button
                  ref={foreignProjectsComboBoxRef}
                  type="default"
                  size="medium"
                  block
                  disabled={loadingForeignProjects}
                  loading={loadingForeignProjects}
                  className="justify-start"
                  icon={
                    selectedForeignProject
                      ? getForeignProjectIcon?.(selectedForeignProject)
                      : integrationIcon
                  }
                  iconRight={
                    <span className="grow flex justify-end">
                      <IconChevronDown className={''} />
                    </span>
                  }
                >
                  {(selectedForeignProject && selectedForeignProject.name) ?? choosePrompt}
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_
                className="p-0 w-full"
                side="bottom"
                align="center"
                style={{ width: foreignProjectsComboBoxRef.current?.offsetWidth }}
              >
                <Command_Shadcn_>
                  <CommandInput_Shadcn_ placeholder="Search organization..." />
                  <CommandList_Shadcn_ className="!max-h-[170px]">
                    <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
                    <CommandGroup_Shadcn_>
                      {filteredForeignProjects.map((project) => {
                        return (
                          <CommandItem_Shadcn_
                            value={project.id}
                            key={project.id}
                            className="flex gap-2 items-center"
                            onSelect={(id) => {
                              if (id) setForeignProjectId(id)
                              setForeignProjectsComboboxOpen(false)
                            }}
                          >
                            {getForeignProjectIcon?.(project) ?? integrationIcon}
                            <span>{project.name}</span>
                          </CommandItem_Shadcn_>
                        )
                      })}
                    </CommandGroup_Shadcn_>
                  </CommandList_Shadcn_>
                </Command_Shadcn_>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          </Panel>
        </div>
      </div>
      <div className="flex w-full justify-end gap-2">
        {onSkip !== undefined && (
          <Button
            size="medium"
            type="default"
            onClick={() => {
              onSkip()
            }}
          >
            Skip
          </Button>
        )}
        <Button
          size="medium"
          className="self-end"
          onClick={onCreateConnections}
          loading={isLoading}
          disabled={
            // data loading states
            loadingForeignProjects ||
            loadingSupabaseProjects ||
            isLoading ||
            // check wether both project types are not undefined
            !selectedSupabaseProject ||
            !selectedForeignProject
          }
        >
          Connect project
        </Button>
      </div>
    </div>
  )
}

export default ProjectLinker
