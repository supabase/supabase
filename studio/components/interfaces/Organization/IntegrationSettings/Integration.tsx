import dayjs from 'dayjs'
import { pluralize } from 'lib/helpers'
import { EMPTY_ARR } from 'lib/void'
import { Button, IconArrowRight } from 'ui'

export interface OrganizationConnection {
  id: string
  orgName: string
  addedByUser: string
}

export interface ProjectConnection {
  id: string
  createdAt: string
  /** External resource name */
  fromProjectName: string
  /** Supabase project name */
  toProjectName: string
}

export interface IntegrationProps {
  title: string
  description?: string
  note?: string
  organizationConnections?: OrganizationConnection[]
  projectConnections?: ProjectConnection[]
}

const Integration = ({
  title,
  description,
  note,
  organizationConnections = EMPTY_ARR,
  projectConnections = EMPTY_ARR,
}: IntegrationProps) => {
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

        {organizationConnections.length > 0 && (
          <ul className="flex flex-col gap-2">
            {organizationConnections.map((connection) => (
              <li
                key={connection.id}
                className="flex justify-between items-center px-6 py-4 rounded-lg border border-scale-500 bg-panel-body-light dark:bg-panel-body-dark"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-scale-1100 font-medium">
                    {title} integration connection | {connection.orgName}
                  </span>
                  <span className="text-scale-900 text-sm">Added by {connection.addedByUser}</span>
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
                      <span>{connection.fromProjectName}</span>
                      <IconArrowRight />
                      <span>{connection.toProjectName}</span>
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
