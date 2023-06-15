import { databaseIcon, vercelIcon } from 'components/to-be-cleaned/ListIcons'
import { useIntegrationConnectionsCreateMutation } from 'data/integrations/integration-connections-create-mutation'
import { VercelProjectsResponse } from 'data/integrations/integrations-vercel-projects-query'
import { useState } from 'react'
import { TRUE } from 'sass'
import { Button, IconArrowRight, IconPlus, IconX, Listbox } from 'ui'

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
}

const UNDEFINED_SELECT_VALUE = 'undefined'
const UNDEFINED_METADATA_VALUE = {}

const ProjectLinker = ({
  organizationIntegrationId,
  foreignProjects,
  supabaseProjects,
  onCreateConnections: _onCreateConnections,
}: ProjectLinkerProps) => {
  const [connections, setConnections] = useState([
    {
      foreignProjectId: UNDEFINED_SELECT_VALUE,
      supabaseProjectId: UNDEFINED_SELECT_VALUE,
      integrationId: INTEGRATION_INTERNAL_ID,
      metadata: UNDEFINED_METADATA_VALUE,
    },
  ])

  function onSetForeignProjectId(idx: number, id: string) {
    console.log(id)

    console.log(foreignProjects)
    const newConnections = [...connections]
    const projectDetails = foreignProjects.filter((x) => x.id === id)[0]
    newConnections[idx].metadata = { ...projectDetails }
    newConnections[idx].foreignProjectId = id
    newConnections[idx].supabaseConfig = {
      projectEnvVars: {
        write: true,
      },
    }

    setConnections(newConnections)
  }

  function onSetSupabaseProjectId(idx: number, id: string) {
    const newConnections = [...connections]
    newConnections[idx].supabaseProjectId = id
    setConnections(newConnections)
  }

  function addConnection() {
    setConnections([
      ...connections,
      {
        foreignProjectId: UNDEFINED_SELECT_VALUE,
        supabaseProjectId: UNDEFINED_SELECT_VALUE,
        integrationId: INTEGRATION_INTERNAL_ID,
        metadata: UNDEFINED_METADATA_VALUE,
      },
    ])
  }

  function removeConnection(idx: number) {
    const newConnections = [...connections]
    newConnections.splice(idx, 1)
    setConnections(newConnections)
  }

  const { mutate: createConnections, isLoading } = useIntegrationConnectionsCreateMutation({
    onSuccess() {
      _onCreateConnections?.()
    },
  })

  function onCreateConnections() {
    console.log('connections', connections)
    createConnections({
      organizationIntegrationId,
      connections,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <ul>
        {connections.map((connection, i) => (
          <ProjectLinkerItem
            key={i}
            connections={connections}
            foreignProjects={foreignProjects}
            supabaseProjects={supabaseProjects}
            foreignProjectId={connection.foreignProjectId}
            setForeignProjectId={(id) => onSetForeignProjectId(i, id)}
            supabaseProjectId={connection.supabaseProjectId}
            setSupabaseProjectId={(id) => onSetSupabaseProjectId(i, id)}
            removeConnection={() => removeConnection(i)}
            canRemove={connections.length > 1}
          />
        ))}
      </ul>

      <Button
        onClick={addConnection}
        type="default"
        icon={<IconPlus strokeWidth={2} />}
        className="self-start"
      >
        Add Connection
      </Button>

      <hr className="h-px bg-scale-500" role="separator" />

      <Button
        className="self-end"
        onClick={onCreateConnections}
        loading={isLoading}
        disabled={isLoading}
      >
        Continue
      </Button>
    </div>
  )
}

export default ProjectLinker

interface ProjectLinkerItemProps {
  foreignProjects: Project[]
  supabaseProjects: Project[]
  foreignProjectId: string
  setForeignProjectId: (id: string) => void
  supabaseProjectId: string
  setSupabaseProjectId: (id: string) => void
  removeConnection: () => void
  canRemove: boolean
  connections: any[]
}

const ProjectLinkerItem = ({
  foreignProjects,
  supabaseProjects,
  foreignProjectId,
  setForeignProjectId,
  supabaseProjectId,
  setSupabaseProjectId,
  removeConnection,
  canRemove,
}: ProjectLinkerItemProps) => {
  return (
    <li className="py-2">
      <div className="relative flex w-full space-x-2">
        <div className="w-1/2 flex-grow">
          <Listbox
            value={supabaseProjectId ?? UNDEFINED_SELECT_VALUE}
            onChange={setSupabaseProjectId}
          >
            <Listbox.Option value={UNDEFINED_SELECT_VALUE} label="Choose a project" disabled>
              Choose a project
            </Listbox.Option>

            {supabaseProjects.map((project) => (
              <Listbox.Option
                key={project.id}
                value={project.id}
                label={project.name}
                addOnBefore={() => databaseIcon}
              >
                {project.name}
              </Listbox.Option>
            ))}
          </Listbox>
        </div>
        <div className="flex flex-shrink items-center">
          <IconArrowRight className="text-scale-1000" />
        </div>
        <div className="w-1/2 flex-grow">
          <Listbox
            value={foreignProjectId ?? UNDEFINED_SELECT_VALUE}
            onChange={setForeignProjectId}
          >
            <Listbox.Option value={UNDEFINED_SELECT_VALUE} label="Choose a project" disabled>
              Choose a project
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
        </div>

        {canRemove && (
          <Button type="text" icon={<IconX strokeWidth={2} />} onClick={removeConnection} />
        )}
      </div>
    </li>
  )
}
