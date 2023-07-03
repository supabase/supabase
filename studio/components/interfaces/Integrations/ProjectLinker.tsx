import { useState } from 'react'

import { ENV_VAR_RAW_KEYS } from 'components/interfaces/Integrations/Integrations-Vercel.constants'
import { Markdown } from 'components/interfaces/Markdown'
import { vercelIcon } from 'components/to-be-cleaned/ListIcons'
import { useIntegrationConnectionsCreateMutation } from 'data/integrations/integration-connections-create-mutation'
import { VercelProjectsResponse } from 'data/integrations/integrations-vercel-projects-query'
import { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { useSelectedOrganization } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { Button, Listbox, cn } from 'ui'

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
}

const UNDEFINED_SELECT_VALUE = 'undefined'

const ProjectLinker = ({
  organizationIntegrationId,
  foreignProjects,
  supabaseProjects,
  onCreateConnections: _onCreateConnections,
  installedConnections = [],
}: ProjectLinkerProps) => {
  const selectedOrganization = useSelectedOrganization()

  const [supabaseProjectRef, setSupabaseProjectRef] = useState(UNDEFINED_SELECT_VALUE)
  const [vercelProjectId, setVercelProjectId] = useState(UNDEFINED_SELECT_VALUE)

  const { mutate: createConnections, isLoading } = useIntegrationConnectionsCreateMutation({
    onSuccess() {
      _onCreateConnections?.()
    },
  })

  function onCreateConnections() {
    const projectDetails = foreignProjects.filter((x) => x.id === vercelProjectId)[0]

    if (!organizationIntegrationId) {
      console.error('No integration ID set')
      return
    }

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

  // check that vercel project is not already installed
  const filteredForeignProjects: VercelProjectsResponse[] = foreignProjects.filter(
    (foreignProject) => {
      return !flatInstalledConnectionsIds.has(foreignProject.id)
    }
  )

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
              {/* <img src="/img/icons/vercel.svg" style={{ height: 21 }} alt="integration icon" /> */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="white"
                viewBox="0 0 512 512"
                className="w-6"
              >
                <path fill-rule="evenodd" d="M256,48,496,464H16Z" />
              </svg>
            </div>
            <Listbox
              className="w-full"
              value={vercelProjectId ?? UNDEFINED_SELECT_VALUE}
              onChange={(e) => setVercelProjectId(e)}
            >
              <Listbox.Option value={UNDEFINED_SELECT_VALUE} label="Choose a project" disabled>
                Choose Vercel project
              </Listbox.Option>
              {filteredForeignProjects.map((project) => {
                return (
                  <Listbox.Option
                    key={project.id}
                    value={project.id}
                    label={project.name}
                    addOnBefore={() => {
                      return (
                        <>
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
                        </>
                      )
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
