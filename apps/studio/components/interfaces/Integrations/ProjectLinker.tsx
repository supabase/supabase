import { ChevronDown, PlusIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

import ShimmerLine from 'components/ui/ShimmerLine'
import {
  IntegrationConnectionsCreateVariables,
  IntegrationProjectConnection,
} from 'data/integrations/integrations.types'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { BASE_PATH } from 'lib/constants'
import { openInstallGitHubIntegrationWindow } from 'lib/github'
import { EMPTY_ARR } from 'lib/void'
import {
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
  cn,
} from 'ui'

export interface Project {
  name: string
  ref: string
}

export interface ForeignProject {
  id: string
  name: string
  installation_id?: number
}

export interface ProjectLinkerProps {
  organizationIntegrationId?: string
  foreignProjects: ForeignProject[]
  supabaseProjects: Project[]
  onCreateConnections: (variables: IntegrationConnectionsCreateVariables) => void
  installedConnections?: IntegrationProjectConnection[]
  isLoading?: boolean
  integrationIcon: ReactNode
  getForeignProjectIcon?: (project: ForeignProject) => ReactNode
  choosePrompt?: string
  onSkip?: () => void
  loadingForeignProjects?: boolean
  loadingSupabaseProjects?: boolean
  showNoEntitiesState?: boolean

  defaultSupabaseProjectRef?: string
  defaultForeignProjectId?: string
  mode: 'Vercel' | 'GitHub'
}

const ProjectLinker = ({
  organizationIntegrationId,
  foreignProjects,
  supabaseProjects,
  onCreateConnections: _onCreateConnections,
  installedConnections = EMPTY_ARR,
  isLoading,
  integrationIcon,
  getForeignProjectIcon,
  choosePrompt = 'Choose a project',
  onSkip,
  loadingForeignProjects,
  loadingSupabaseProjects,
  showNoEntitiesState = true,

  defaultSupabaseProjectRef,
  defaultForeignProjectId,
  mode,
}: ProjectLinkerProps) => {
  const router = useRouter()
  const [supabaseProjectsComboBoxOpen, setSupabaseProjectsComboboxOpen] = useState(false)
  const [foreignProjectsComboBoxOpen, setForeignProjectsComboboxOpen] = useState(false)
  const supabaseProjectsComboBoxRef = useRef<HTMLButtonElement>(null)
  const foreignProjectsComboBoxRef = useRef<HTMLButtonElement>(null)

  const selectedOrganization = useSelectedOrganization()

  const [supabaseProjectRef, setSupabaseProjectRef] = useState<string | undefined>(
    defaultSupabaseProjectRef
  )
  useEffect(() => {
    if (defaultSupabaseProjectRef !== undefined && supabaseProjectRef === undefined)
      setSupabaseProjectRef(defaultSupabaseProjectRef)
  }, [defaultSupabaseProjectRef, supabaseProjectRef])

  const [foreignProjectId, setForeignProjectId] = useState<string | undefined>(
    defaultForeignProjectId
  )
  useEffect(() => {
    if (defaultForeignProjectId !== undefined && foreignProjectId === undefined)
      setForeignProjectId(defaultForeignProjectId)
  }, [defaultForeignProjectId, foreignProjectId])

  // create a flat array of foreign project ids. ie, ["prj_MlkO6AiLG5ofS9ojKrkS3PhhlY3f", ..]
  const flatInstalledConnectionsIds = new Set(installedConnections.map((x) => x.foreign_project_id))

  const selectedSupabaseProject = supabaseProjectRef
    ? supabaseProjects.find((x) => x.ref?.toLowerCase() === supabaseProjectRef?.toLowerCase())
    : undefined

  const selectedForeignProject = foreignProjectId
    ? foreignProjects.find((x) => x.id?.toLowerCase() === foreignProjectId?.toLowerCase())
    : undefined

  function onCreateConnections() {
    const projectDetails = selectedForeignProject

    if (!selectedForeignProject?.id) return console.error('No Foreign project ID set')
    if (!selectedSupabaseProject?.ref) return console.error('No Supabase project ref set')

    const alreadyInstalled = flatInstalledConnectionsIds.has(foreignProjectId ?? '')
    if (alreadyInstalled) {
      return toast.error(
        `Unable to connect to ${selectedForeignProject.name}: Selected repository already has an installed connection to a project`
      )
    }

    _onCreateConnections({
      organizationIntegrationId: organizationIntegrationId!,
      connection: {
        foreign_project_id: selectedForeignProject?.id,
        supabase_project_ref: selectedSupabaseProject?.ref,
        integration_id: '0',
        metadata: {
          ...projectDetails,
        },
      },
      orgSlug: selectedOrganization?.slug,
      new: {
        installation_id: selectedForeignProject.installation_id!,
        project_ref: selectedSupabaseProject.ref,
        repository_id: Number(selectedForeignProject.id),
      },
    })
  }

  const Panel = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
      <div
        className={cn(
          'flex-1 min-w-0 flex flex-col grow gap-6 px-5 mx-auto w-full justify-center items-center',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  const noSupabaseProjects = supabaseProjects.length === 0
  const noForeignProjects = foreignProjects.length === 0
  const missingEntity = noSupabaseProjects ? 'Supabase' : mode
  const oppositeMissingEntity = noSupabaseProjects ? mode : 'Supabase'

  return (
    <div className="flex flex-col gap-4">
      <div className="relative border rounded-lg p-12 bg shadow">
        <div
          className="absolute inset-0 bg-grid-black/5 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-white/5 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"
          style={{ backgroundPosition: '10px 10px' }}
        />

        {loadingForeignProjects || loadingSupabaseProjects ? (
          <div className="w-1/2 mx-auto space-y-2 py-4">
            <p className="text-sm text-foreground text-center">Loading projects</p>
            <ShimmerLine active />
          </div>
        ) : showNoEntitiesState && (noSupabaseProjects || noForeignProjects) ? (
          <div className="text-center">
            <h5 className="text-foreground">No {missingEntity} Projects found</h5>
            <p className="text-foreground-light text-sm">
              You will need to create a {missingEntity} Project to link to a {oppositeMissingEntity}{' '}
              Project.
              <br />
              You can skip this and create a Project Connection later.
            </p>
          </div>
        ) : (
          <div className="flex justify-center gap-0 w-full relative">
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
                    block
                    disabled={defaultSupabaseProjectRef !== undefined || loadingSupabaseProjects}
                    loading={loadingSupabaseProjects}
                    className="justify-start h-[34px]"
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
                      defaultSupabaseProjectRef === undefined ? (
                        <span className="grow flex justify-end">
                          <ChevronDown />
                        </span>
                      ) : null
                    }
                  >
                    {selectedSupabaseProject
                      ? selectedSupabaseProject.name
                      : 'Choose Supabase Project'}
                  </Button>
                </PopoverTrigger_Shadcn_>
                <PopoverContent_Shadcn_
                  className="p-0 !w-72"
                  side="bottom"
                  align="center"
                  style={{ width: supabaseProjectsComboBoxRef.current?.offsetWidth }}
                >
                  <Command_Shadcn_>
                    <CommandInput_Shadcn_ placeholder="Search for a project" />
                    <CommandList_Shadcn_ className="!max-h-[170px]">
                      <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
                      <CommandGroup_Shadcn_>
                        {supabaseProjects.map((project, i) => {
                          return (
                            <CommandItem_Shadcn_
                              value={`${project.name.replaceAll('"', '')}-${i}`}
                              key={project.ref}
                              className="flex gap-2 items-center"
                              onSelect={() => {
                                if (project.ref) setSupabaseProjectRef(project.ref)
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
                        {supabaseProjects.length === 0 && (
                          <p className="text-xs text-foreground-lighter px-2 py-2">
                            No projects found in this organization
                          </p>
                        )}
                      </CommandGroup_Shadcn_>
                      <CommandSeparator_Shadcn_ />
                      <CommandGroup_Shadcn_>
                        <CommandItem_Shadcn_
                          className="flex gap-2 items-center cursor-pointer"
                          onClick={() => router.push(`/new/${selectedOrganization?.slug}`)}
                          onSelect={() => router.push(`/new/${selectedOrganization?.slug}`)}
                        >
                          <PlusIcon size={16} />
                          <span>Create a new project</span>
                        </CommandItem_Shadcn_>
                      </CommandGroup_Shadcn_>
                    </CommandList_Shadcn_>
                  </Command_Shadcn_>
                </PopoverContent_Shadcn_>
              </Popover_Shadcn_>
            </Panel>

            <div className="border border-foreground-lighter h-px w-8 border-dashed self-end mb-4" />

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
                    block
                    disabled={loadingForeignProjects}
                    loading={loadingForeignProjects}
                    className="justify-start h-[34px]"
                    icon={
                      <div>
                        {selectedForeignProject
                          ? getForeignProjectIcon?.(selectedForeignProject) ?? integrationIcon
                          : integrationIcon}
                      </div>
                    }
                    iconRight={
                      <span className="grow flex justify-end">
                        <ChevronDown />
                      </span>
                    }
                  >
                    {(selectedForeignProject && selectedForeignProject.name) ?? choosePrompt}
                  </Button>
                </PopoverTrigger_Shadcn_>
                <PopoverContent_Shadcn_
                  className="p-0 !w-72"
                  side="bottom"
                  align="center"
                  style={{ width: foreignProjectsComboBoxRef.current?.offsetWidth }}
                >
                  <Command_Shadcn_>
                    <CommandInput_Shadcn_ placeholder="Search for a project" />
                    <CommandList_Shadcn_ className="!max-h-[170px]">
                      <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
                      <CommandGroup_Shadcn_>
                        {foreignProjects.map((project, i) => {
                          return (
                            <CommandItem_Shadcn_
                              key={project.id}
                              value={`${project.name.replaceAll('"', '')}-${i}`}
                              className="flex gap-2 items-center"
                              onSelect={() => {
                                if (project.id) setForeignProjectId(project.id)
                                setForeignProjectsComboboxOpen(false)
                              }}
                            >
                              <div>{getForeignProjectIcon?.(project) ?? integrationIcon}</div>
                              <span className="truncate" title={project.name}>
                                {project.name}
                              </span>
                            </CommandItem_Shadcn_>
                          )
                        })}
                        {foreignProjects.length === 0 && (
                          <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
                        )}
                      </CommandGroup_Shadcn_>
                      {mode === 'GitHub' && (
                        <>
                          <CommandSeparator_Shadcn_ />
                          <CommandGroup_Shadcn_>
                            <CommandItem_Shadcn_
                              className="flex gap-2 items-center cursor-pointer"
                              onSelect={() => openInstallGitHubIntegrationWindow('install')}
                            >
                              <PlusIcon size={16} />
                              Add GitHub Repositories
                            </CommandItem_Shadcn_>
                          </CommandGroup_Shadcn_>
                        </>
                      )}
                    </CommandList_Shadcn_>
                  </Command_Shadcn_>
                </PopoverContent_Shadcn_>
              </Popover_Shadcn_>
            </Panel>
          </div>
        )}
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
            // check whether both project types are not undefined
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
