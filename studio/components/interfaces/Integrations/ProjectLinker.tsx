import { ENV_VAR_RAW_KEYS } from 'components/interfaces/Integrations/Integrations-Vercel.constants'
import { Markdown } from 'components/interfaces/Markdown'
import { vercelIcon } from 'components/to-be-cleaned/ListIcons'
import { useIntegrationConnectionsCreateMutation } from 'data/integrations/integration-connections-create-mutation'
import { VercelProjectsResponse } from 'data/integrations/integrations-vercel-projects-query'
import { BASE_PATH } from 'lib/constants'
import { useState } from 'react'
import { Button, IconArrowRight, IconPlus, IconX, Input, Listbox, Select, cn } from 'ui'

interface Project {
  id: string
  name: string
}

// to do: move this somewhere
const INTEGRATION_INTERNAL_ID = 1

export interface ProjectLinkerProps {
  organizationIntegrationId: string
  foreignProjects: VercelProjectsResponse[]
  supabaseProjects: Project[]
  onCreateConnections?: () => void
  installedConnections?: any[]
}

const UNDEFINED_SELECT_VALUE = 'undefined'
const UNDEFINED_METADATA_VALUE = {}

const ProjectLinker = ({
  organizationIntegrationId,
  foreignProjects,
  supabaseProjects,
  onCreateConnections: _onCreateConnections,
  installedConnections,
}: ProjectLinkerProps) => {
  const [supabaseProjectId, setSupabaseProjectId] = useState('')
  const [vercelProjectId, setVercelProjectId] = useState('')

  // function addConnection() {
  //   setConnections([
  //     ...connections,
  //     {
  //       foreign_project_id: UNDEFINED_SELECT_VALUE,
  //       supabase_project_id: UNDEFINED_SELECT_VALUE,
  //       integrationId: INTEGRATION_INTERNAL_ID,
  //       metadata: UNDEFINED_METADATA_VALUE,
  //     },
  //   ])
  // }

  // function removeConnection(idx: number) {
  //   const newConnections = [...connections]
  //   newConnections.splice(idx, 1)
  //   setConnections(newConnections)
  // }

  const { mutate: createConnections, isLoading } = useIntegrationConnectionsCreateMutation({
    onSuccess() {
      _onCreateConnections?.()
    },
  })

  function onCreateConnections() {
    const projectDetails = foreignProjects.filter((x) => x.id === vercelProjectId)[0]

    createConnections({
      organizationIntegrationId,
      connections: [
        {
          foreign_project_id: vercelProjectId,
          supabase_project_id: supabaseProjectId,
          integrationId: INTEGRATION_INTERNAL_ID,
          metadata: {
            ...projectDetails,
            supabaseConfig: {
              projectEnvVars: {
                write: true,
              },
            },
          },
        },
      ],
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

  return (
    <div className="flex flex-col gap-4">
      <div className="relative border rounded-lg p-12 bg border-body">
        <div
          className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"
          style={{ backgroundPosition: '10px 10px' }}
        ></div>
        <div className="flex gap-0 w-full relative">
          <Panel>
            <div className="bg-white shadow border rounded p-1 w-12 h-12 flex justify-center items-center">
              <img src={`${BASE_PATH}/img/supabase-logo.svg`} alt="Supabase" className="w-6" />
            </div>
            <Listbox
              className="w-full"
              value={supabaseProjectId ?? UNDEFINED_SELECT_VALUE}
              onChange={(e) => setSupabaseProjectId(e)}
            >
              <Listbox.Option value={UNDEFINED_SELECT_VALUE} label="Choose a project" disabled>
                Choose a Supabase project
              </Listbox.Option>
              {supabaseProjects.map((project) => (
                <Listbox.Option
                  key={project.id}
                  value={project.id}
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
                fill="var(--colors-scale12)"
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
                Choose a Vercel project
              </Listbox.Option>
              {foreignProjects.map((project) => (
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
                            src={`/img/icons/frameworks/${project.framework}.svg`}
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
              ))}
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
      {/* <div>
        <p className="text-scale-900 text-sm mb-3">
          The following enviroment variables will be added:
        </p>
        <p>
          {ENV_VAR_RAW_KEYS.map((x, idx) => {
            return (
              <span key={idx} className="text-scale-1100 text-xs font-mono">
                {x},{' '}
              </span>
            )
          })}
        </p>
      </div> */}
      <Markdown
        content={`
The following enviroment variables will be added:

${ENV_VAR_RAW_KEYS.map((x, idx) => {
  return `
  \n
  - \`${x}\` - ${(<span>This is the URL for the Project</span>)}
`
})}
`}
      />
    </div>
  )
}

export default ProjectLinker
