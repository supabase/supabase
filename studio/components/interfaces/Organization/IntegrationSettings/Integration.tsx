import {
  EmptyIntegrationConnection,
  IntegrationConnection,
  IntegrationConnectionHeader,
  IntegrationInstallation,
} from 'components/interfaces/Integrations/IntegrationPanels'
import { Markdown } from 'components/interfaces/Markdown'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { Integration as TIntegration } from 'data/integrations/integrations-query'
import { useStore } from 'hooks'
import { pluralize } from 'lib/helpers'
import { EMPTY_ARR } from 'lib/void'
import { useMemo } from 'react'

export interface IntegrationProps {
  title: string
  orgName?: string
  description?: string
  note?: string
  detail?: string
  integrations?: TIntegration[]
}

const Integration = ({
  title,
  orgName,
  description,
  note,
  detail,
  integrations = EMPTY_ARR,
}: IntegrationProps) => {
  const { ui } = useStore()

  const projectConnections = useMemo(
    () => integrations.flatMap((integration) => integration.connections),
    [integrations]
  )

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <ScaffoldSectionDetail>
            {detail && <Markdown content={detail} />}
            <img
              className="border rounded-lg shadow w-48 mt-6 border-body"
              src={`/img/integrations/covers/${title.toLowerCase()}-cover.png?v=3`}
              alt="cover"
            />
          </ScaffoldSectionDetail>
          <ScaffoldSectionContent>
            <div>
              <Markdown content={`${description}`} />
            </div>
            <div className="flex flex-col gap-12">
              {integrations.length > 0 &&
                integrations.map((integration, i) => {
                  return (
                    <div key={i}>
                      <IntegrationInstallation
                        title={title}
                        key={i}
                        orgName={orgName}
                        connection={integration}
                      />
                      {integration.connections.length > 0 ? (
                        <>
                          <IntegrationConnectionHeader
                            title={`${integration.connections.length} project
                        ${pluralize(integration.connections.length, 'connection')}`}
                            name={
                              integration.type +
                              ' • ' +
                              (integration.metadata?.gitHubConnectionOwner ??
                                integration.metadata?.vercelTeam)
                            }
                          />

                          <ul className="flex flex-col">
                            {integration.connections.map((connection, i) => (
                              <IntegrationConnection
                                key={i}
                                connection={connection}
                                type={integration.type}
                              />
                            ))}
                          </ul>
                        </>
                      ) : (
                        <IntegrationConnectionHeader
                          title={`${integration.connections.length} project
                        ${pluralize(integration.connections.length, 'connection')}`}
                          name={
                            integration.type +
                            ' • ' +
                            (integration.metadata?.gitHubConnectionOwner ??
                              integration.metadata?.vercelTeam)
                          }
                        />
                      )}
                      <EmptyIntegrationConnection
                        onClick={() => ui.setShowGitHubRepoSelectionPanel(true)}
                      >
                        Add new project connection
                      </EmptyIntegrationConnection>
                    </div>
                  )
                })}
            </div>

            <Markdown content={`${note}`} className="text-scale-900" />
          </ScaffoldSectionContent>
        </ScaffoldSection>
      </ScaffoldContainer>
    </>
  )
}

export default Integration
