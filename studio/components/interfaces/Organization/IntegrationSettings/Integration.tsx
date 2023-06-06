import { Integration as TIntegration } from 'data/integrations/integrations-query'
import dayjs from 'dayjs'
import { pluralize } from 'lib/helpers'
import { EMPTY_ARR } from 'lib/void'
import { useMemo } from 'react'
import { Button, IconArrowRight } from 'ui'
export interface IntegrationProps {
  title: string
  orgName?: string
  description?: string
  note?: string
  integrations?: TIntegration[]
}

const Integration = ({
  title,
  orgName,
  description,
  note,
  integrations = EMPTY_ARR,
}: IntegrationProps) => {
  const projectConnections = useMemo(
    () => integrations.flatMap((integration) => integration.connections),
    [integrations]
  )

  return (
    <>
      <div>
        <h2 className="text-2xl text-scale-1200">{title}</h2>
      </div>

      <div className="flex flex-col gap-8">
        {description !== undefined && (
          <div className="flex flex-col gap-1">
            <h3>How does the {title} integration work?</h3>
            <p className="text-scale-900 text-sm">{description}</p>
          </div>
        )}

        {integrations.length > 0 && (
          <ul className="flex flex-col gap-2">
            {integrations.map((connection) => (
              <li
                key={connection.id}
                className="flex justify-between items-center px-6 py-4 rounded-lg border border-scale-500 bg-panel-body-light dark:bg-panel-body-dark"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-scale-1200 font-medium">
                    {title} integration connection | {orgName}
                  </span>
                  <span className="text-scale-900 text-sm">Added by {connection.createdBy}</span>
                </div>

                <div>
                  <Button type="outline">Manage</Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <hr className="h-px bg-scale-500" role="separator" />

        {projectConnections.length > 0 && (
          <div className="flex flex-col gap-4">
            <h4>
              {projectConnections.length} project{' '}
              {pluralize(projectConnections.length, 'connection')}
            </h4>

            <ul className="flex flex-col gap-2">
              {projectConnections.map((connection) => (
                <li
                  key={connection.id}
                  className="flex justify-between items-center px-6 py-4 rounded-lg border border-scale-500 bg-panel-body-light dark:bg-panel-body-dark"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-2">
                      <span>{connection.from.name}</span>
                      <IconArrowRight />
                      <span>{connection.to.name}</span>
                    </div>

                    <span className="text-scale-900 text-sm">
                      Connected {dayjs(connection.createdAt).fromNow()}
                    </span>
                  </div>

                  <div>
                    <Button type="outline">Disconnect</Button>
                  </div>
                </li>
              ))}
            </ul>

            <Button type="outline" className="self-start">
              Add new project connection
            </Button>
            {note !== undefined && <p className="text-scale-900 text-sm">{note}</p>}
          </div>
        )}
      </div>
    </>
  )
}

export default Integration
