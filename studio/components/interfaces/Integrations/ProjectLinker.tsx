import { ENV_VAR_RAW_KEYS } from 'components/interfaces/Integrations/Integrations-Vercel.constants'
import { Markdown } from 'components/interfaces/Markdown'
import { vercelIcon } from 'components/to-be-cleaned/ListIcons'
import { useIntegrationConnectionsCreateMutation } from 'data/integrations/integration-connections-create-mutation'
import { useIntegrationsVercelConnectionSyncEnvsMutation } from 'data/integrations/integrations-vercel-connection-sync-envs-mutation'
import { VercelProjectsResponse } from 'data/integrations/integrations-vercel-projects-query'
import { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { useSelectedOrganization } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
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

interface Project {
  id: string
  name: string
  ref: string
}

export interface ProjectLinkerProps {
  organizationIntegrationId: string | undefined
  foreignProjects: VercelProjectsResponse[]
  supabaseProjects: Project[]
  onCreateConnections?: () => void
  installedConnections: IntegrationProjectConnection[] | undefined
  setLoading?: (x: boolean) => void
  showSkip?: boolean
  loadingForeignProjects?: boolean
  loadingSupabaseProjects?: boolean
}

const ProjectLinker = ({
  organizationIntegrationId,
  foreignProjects,
  supabaseProjects,
  onCreateConnections: _onCreateConnections,
  installedConnections = [],
  setLoading,
  showSkip = false,
  loadingForeignProjects,
  loadingSupabaseProjects,
}: ProjectLinkerProps) => {
  const [supabaseProjectsComboBoxOpen, setSupabaseProjectsComboboxOpen] = useState(false)
  const [vercelProjectsComboBoxOpen, setVercelProjectsComboboxOpen] = useState(false)
  const supabaseProjectsComboBoxRef = useRef<HTMLButtonElement>(null)
  const vercelProjectsComboBoxRef = useRef<HTMLButtonElement>(null)

  const selectedOrganization = useSelectedOrganization()

  const [supabaseProjectRef, setSupabaseProjectRef] = useState<string | undefined>(undefined)
  const [vercelProjectId, setVercelProjectId] = useState<string | undefined>(undefined)

  const { mutateAsync: syncEnvs } = useIntegrationsVercelConnectionSyncEnvsMutation()
  const { mutate: createConnections, isLoading } = useIntegrationConnectionsCreateMutation({
    async onSuccess({ id }) {
      try {
        await syncEnvs({ connectionId: id })
      } catch (error: any) {
        toast.error('Failed to sync environment variables: ', error.message)
      }

      if (setLoading) setLoading(false)
      _onCreateConnections?.()
    },
    onError() {
      if (setLoading) setLoading(false)
    },
  })

  function onCreateConnections() {
    const projectDetails = foreignProjects.filter((x) => x.id === vercelProjectId)[0]

    if (!organizationIntegrationId) return console.error('No integration ID set')
    if (!vercelProjectId) return console.error('No Vercel project ID set')
    if (!supabaseProjectRef) return console.error('No Supabase project ref set')

    if (setLoading) setLoading(true)

    createConnections({
      organizationIntegrationId,
      connection: {
        foreign_project_id: vercelProjectId,
        supabase_project_ref: supabaseProjectRef,
        metadata: {
          ...projectDetails,
          supabaseConfig: {
            projectEnvVars: {
              write: true,
            },
          },
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

  // create a flat array of foreign project ids. ie, ["prj_MlkO6AiLG5ofS9ojKrkS3PhhlY3f", ..]
  const flatInstalledConnectionsIds = new Set(installedConnections.map((x) => x.foreign_project_id))

  // check that vercel project is not already installed
  const filteredForeignProjects: VercelProjectsResponse[] = foreignProjects.filter(
    (foreignProject) => {
      return !flatInstalledConnectionsIds.has(foreignProject.id)
    }
  )

  const selectedSupabaseProject = supabaseProjectRef
    ? supabaseProjects.find((x) => x.ref?.toLowerCase() === supabaseProjectRef?.toLowerCase())
    : undefined
  const selectedVercelProject = vercelProjectId
    ? filteredForeignProjects.find((x) => x.id?.toLowerCase() === vercelProjectId?.toLowerCase())
    : undefined

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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="white"
                viewBox="0 0 512 512"
                className="w-6"
              >
                <path fill-rule="evenodd" d="M256,48,496,464H16Z" />
              </svg>
            </div>

            <Popover_Shadcn_
              open={vercelProjectsComboBoxOpen}
              onOpenChange={setVercelProjectsComboboxOpen}
            >
              <PopoverTrigger_Shadcn_ asChild>
                <Button
                  ref={vercelProjectsComboBoxRef}
                  type="default"
                  size="medium"
                  block
                  disabled={loadingForeignProjects}
                  loading={loadingForeignProjects}
                  className="justify-start"
                  icon={
                    selectedVercelProject ? (
                      selectedVercelProject?.framework ? (
                        vercelIcon
                      ) : (
                        <img
                          src={`${BASE_PATH}/img/icons/frameworks/${selectedVercelProject.framework}.svg`}
                          width={21}
                          height={21}
                          alt={`icon`}
                        />
                      )
                    ) : (
                      <></>
                    )
                  }
                  iconRight={
                    <span className="grow flex justify-end">
                      <IconChevronDown className={''} />
                    </span>
                  }
                >
                  {(selectedVercelProject && selectedVercelProject.name) ??
                    'Choose a Vercel Project'}
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_
                className="p-0 w-full"
                side="bottom"
                align="center"
                style={{ width: vercelProjectsComboBoxRef.current?.offsetWidth }}
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
                              if (id) setVercelProjectId(id)
                              setVercelProjectsComboboxOpen(false)
                            }}
                          >
                            {!project?.framework ? (
                              vercelIcon
                            ) : (
                              <img
                                src={`${BASE_PATH}/img/icons/frameworks/${project.framework}.svg`}
                                width={21}
                                height={21}
                                alt={`icon`}
                              />
                            )}
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
        {showSkip && (
          <Button
            size="medium"
            type="default"
            onClick={() => {
              _onCreateConnections?.()
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
            !selectedVercelProject
          }
        >
          Connect project
        </Button>
      </div>
      <Markdown
        content={`
The following environment variables will be added:

${ENV_VAR_RAW_KEYS.map((x, idx) => {
  return `
  \n
  - \`${x}\`
`
})}
`}
      />
    </div>
  )
}

export default ProjectLinker
