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
import { pluralize } from 'lib/helpers'
import { EMPTY_ARR } from 'lib/void'
import { useMemo } from 'react'
import { useGithubConnectionConfigPanelSnapshot } from 'state/github-connection-config-panel'

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
  const githubConnectionConfigPanelShotshot = useGithubConnectionConfigPanelSnapshot()

  const ConnectionHeading = ({ integration }: { integration: TIntegration }) => {
    return (
      <IntegrationConnectionHeader
        markdown={`### ${integration.connections.length} project ${pluralize(
          integration.connections.length,
          'connection'
        )}
Repository connections for ${title?.toLowerCase()}
      `}
      />
    )
  }

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
            <Markdown content={`${description}`} />
            <div className="flex flex-col gap-12">
              {integrations.length > 0 &&
                integrations.map((integration, i) => {
                  return (
                    <div key={i}>
                      <IntegrationInstallation
                        title={title}
                        key={i}
                        // orgName={orgName}
                        connection={integration}
                      />
                      {integration.connections.length > 0 ? (
                        <>
                          <ConnectionHeading integration={integration} />

                          <ul className="flex flex-col">
                            {integration.connections.map((connection, i) => (
                              <IntegrationConnection
                                key={i}
                                connection={connection}
                                type={integration.integration.name}
                              />
                            ))}
                          </ul>
                        </>
                      ) : (
                        <ConnectionHeading integration={integration} />
                      )}
                      <EmptyIntegrationConnection
                        onClick={() => githubConnectionConfigPanelShotshot.setVisible(true)}
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
