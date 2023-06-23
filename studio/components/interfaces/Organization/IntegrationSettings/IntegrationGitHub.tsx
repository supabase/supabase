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
import { Integration as TIntegration } from 'data/integrations/integrations-query-org-only'
import { pluralize } from 'lib/helpers'
import { EMPTY_ARR } from 'lib/void'
import { useMemo } from 'react'

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
      <ScaffoldContainer>
        <ScaffoldSection>
          <ScaffoldSectionDetail>
            <h2 className="text-2xl text-scale-1200">{title}</h2>
          </ScaffoldSectionDetail>
          <ScaffoldSectionContent>
            {description !== undefined && (
              <Markdown
                content={`### How does the ${title} integration work?            
${description}`}
              />
            )}
            <div className="flex flex-col gap-12">
              {integrations.length > 0 &&
                integrations.map((integraton, i) => {
                  return (
                    <div key={i}>
                      <IntegrationInstallation
                        title={title}
                        key={i}
                        orgName={orgName}
                        connection={integraton}
                      />
                      {integraton.connections.length > 0 && (
                        <>
                          <IntegrationConnectionHeader
                            title={`${integraton.connections.length} project
                        ${pluralize(integraton.connections.length, 'connection')}`}
                          />

                          <ul className="flex flex-col">
                            {integraton.connections.map((connection, i) => (
                              <IntegrationConnection key={i} connection={connection} />
                            ))}
                          </ul>

                          <EmptyIntegrationConnection>
                            Add new project connection
                          </EmptyIntegrationConnection>
                        </>
                      )}
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
