import { ReactNode, useState } from 'react'

import { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { IntegrationConnectionsCreateVariables } from 'data/integrations/types'
import { useSelectedOrganization } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { Button, Listbox, cn } from 'ui'

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
}

const UNDEFINED_SELECT_VALUE = 'undefined'

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
}: ProjectLinkerProps) => {
  const selectedOrganization = useSelectedOrganization()

  const [supabaseProjectRef, setSupabaseProjectRef] = useState(UNDEFINED_SELECT_VALUE)
  const [foreignProjectId, setForeignProjectId] = useState(UNDEFINED_SELECT_VALUE)

  function onCreateConnections() {
    const projectDetails = foreignProjects.filter((x) => x.id === foreignProjectId)[0]

    if (!organizationIntegrationId) {
      console.error('No integration ID set')
      return
    }

    _onCreateConnections({
      organizationIntegrationId,
      connection: {
        foreign_project_id: foreignProjectId,
        supabase_project_ref: supabaseProjectRef,
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
          'flex flex-col gap-6 px-5 mx-auto w-full justify-center items-center',
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

  // check that foreign project is not already installed
  const filteredForeignProjects = foreignProjects.filter((foreignProject) => {
    return !flatInstalledConnectionsIds.has(foreignProject.id)
  })

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
            <Listbox
              className="w-full"
              value={supabaseProjectRef ?? UNDEFINED_SELECT_VALUE}
              onChange={(e) => setSupabaseProjectRef(e)}
            >
              <Listbox.Option value={UNDEFINED_SELECT_VALUE} label="Choose a project" disabled>
                Choose project
              </Listbox.Option>
              {supabaseProjects.map((project) => (
                <Listbox.Option
                  key={project.id}
                  value={project.ref}
                  label={project.name}
                  addOnBefore={() => {
                    return (
                      <>
                        <div className="bg-white shadow border rounded p-1 w-6 h-6 flex justify-center items-center">
                          <img
                            src={`${BASE_PATH}/img/supabase-logo.svg`}
                            alt="Supabase"
                            className="w-4"
                          />
                        </div>
                      </>
                    )
                  }}
                >
                  {project.name}
                </Listbox.Option>
              ))}
            </Listbox>
          </Panel>
          <div className="border border-scale-1000 h-px w-16 border-dashed self-end mb-5"></div>
          <Panel>
            <div className="bg-black shadow rounded p-1 w-12 h-12 flex justify-center items-center">
              {integrationIcon}
            </div>
            <Listbox
              className="w-full"
              value={foreignProjectId ?? UNDEFINED_SELECT_VALUE}
              onChange={(e) => setForeignProjectId(e)}
            >
              <Listbox.Option value={UNDEFINED_SELECT_VALUE} label={choosePrompt} disabled>
                {choosePrompt}
              </Listbox.Option>
              {filteredForeignProjects.map((project) => {
                return (
                  <Listbox.Option
                    key={project.id}
                    value={project.id}
                    label={project.name}
                    addOnBefore={() => {
                      return getForeignProjectIcon?.(project) ?? null
                    }}
                  >
                    {project.name}
                  </Listbox.Option>
                )
              })}
            </Listbox>
          </Panel>
        </div>
      </div>
      <div className="flex w-full justify-end">
        <Button
          size="medium"
          className="self-end"
          onClick={onCreateConnections}
          loading={isLoading}
          disabled={isLoading}
        >
          Connect project
        </Button>
      </div>
    </div>
  )
}

export default ProjectLinker
