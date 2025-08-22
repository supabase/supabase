import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'

import { IntegrationConnectionItem } from 'components/interfaces/Integrations/VercelGithub/IntegrationConnection'
import {
  EmptyIntegrationConnection,
  IntegrationConnectionHeader,
  IntegrationInstallation,
} from 'components/interfaces/Integrations/VercelGithub/IntegrationPanels'
import { Markdown } from 'components/interfaces/Markdown'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import type {
  IntegrationName,
  IntegrationProjectConnection,
  Integration,
} from 'data/integrations/integrations.types'
import { pluralize } from 'lib/helpers'
import { Button, cn } from 'ui'
import { IntegrationImageHandler } from '../IntegrationsSettings'

interface VercelSectionBaseProps {
  isLoadingPermissions?: boolean
  canReadVercelConnection: boolean
  canCreateVercelConnection: boolean
  canUpdateVercelConnection: boolean
  vercelIntegration: Integration | undefined
  connections: IntegrationProjectConnection[]
  onAddVercelConnection: (integrationId: string) => void
  onDeleteVercelConnection: (connection: IntegrationProjectConnection) => void | Promise<void>
  integrationUrl: string
  vercelContentSectionTop: string
  vercelContentSectionBottom?: string
  vercelTitle?: string
  vercelDetailsSection?: string
  isBranch?: boolean
  renderConnectionItem?: (connection: IntegrationProjectConnection) => ReactNode
  additionalContent?: ReactNode
}

export const VercelSectionBase = ({
  isLoadingPermissions = false,
  canReadVercelConnection,
  canCreateVercelConnection,
  canUpdateVercelConnection,
  vercelIntegration,
  connections,
  onAddVercelConnection,
  onDeleteVercelConnection,
  integrationUrl,
  vercelContentSectionTop,
  vercelContentSectionBottom,
  vercelTitle = 'Vercel Integration',
  vercelDetailsSection = 'Connect your Vercel teams to your Supabase organization.',
  isBranch = false,
  renderConnectionItem,
  additionalContent,
}: VercelSectionBaseProps) => {
  const ConnectionHeaderTitle = `${connections.length} project ${pluralize(
    connections.length,
    'connection'
  )}`

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionDetail title={vercelTitle}>
          <Markdown content={vercelDetailsSection} />
          <IntegrationImageHandler title="vercel" />
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          {isLoadingPermissions ? (
            <GenericSkeletonLoader />
          ) : !canReadVercelConnection ? (
            <NoPermission resourceText="view this organization's Vercel connections" />
          ) : (
            <>
              <Markdown content={vercelContentSectionTop} />
              {vercelIntegration ? (
                <div key={vercelIntegration.id}>
                  <IntegrationInstallation title={'Vercel'} integration={vercelIntegration} />
                  {connections.length > 0 ? (
                    <>
                      <IntegrationConnectionHeader
                        title={ConnectionHeaderTitle}
                        markdown={`Repository connections for Vercel`}
                      />
                      <ul className="flex flex-col">
                        {connections.map((connection) =>
                          renderConnectionItem ? (
                            renderConnectionItem(connection)
                          ) : (
                            <div key={connection.id}>
                              <IntegrationConnectionItem
                                connection={connection}
                                disabled={isBranch || !canUpdateVercelConnection}
                                type={'Vercel' as IntegrationName}
                                onDeleteConnection={onDeleteVercelConnection}
                              />
                            </div>
                          )
                        )}
                      </ul>
                    </>
                  ) : (
                    <IntegrationConnectionHeader
                      title={ConnectionHeaderTitle}
                      className="pb-0"
                      markdown={`Repository connections for Vercel`}
                    />
                  )}
                  <EmptyIntegrationConnection
                    disabled={isBranch || !canCreateVercelConnection}
                    onClick={() => onAddVercelConnection(vercelIntegration.id)}
                  >
                    Add new project connection
                  </EmptyIntegrationConnection>
                </div>
              ) : (
                <div>
                  <Button
                    icon={<ExternalLink />}
                    asChild={!isBranch}
                    type="default"
                    disabled={isBranch}
                  >
                    {isBranch ? (
                      <p>Install Vercel Integration</p>
                    ) : (
                      <Link href={integrationUrl} target="_blank" rel="noreferrer">
                        Install Vercel Integration
                      </Link>
                    )}
                  </Button>
                </div>
              )}
              {vercelContentSectionBottom && (
                <Markdown
                  extLinks
                  content={vercelContentSectionBottom}
                  className="text-foreground-lighter"
                />
              )}
              {additionalContent}
            </>
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}