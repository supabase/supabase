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
import { useIntegrationsVercelInstalledConnectionDeleteMutation } from 'data/integrations/integrations-vercel-installed-connection-delete-mutation'
import {
  IntegrationProjectConnection,
  Integration as TIntegration,
} from 'data/integrations/integrations.types'
import { useSelectedOrganization } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { pluralize } from 'lib/helpers'
import { EMPTY_ARR } from 'lib/void'
import { useGithubConnectionConfigPanelSnapshot } from 'state/github-connection-config-panel'
import { Button, Dropdown, IconChevronDown, IconRefreshCcw, IconTrash } from 'ui'

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
  const snapshot = useGithubConnectionConfigPanelSnapshot()

  const selectedOrganization = useSelectedOrganization()

  const { mutate: deleteMutate, isLoading: isDeleteLoading } =
    useIntegrationsVercelInstalledConnectionDeleteMutation()

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

  // Call the mutation when needed
  const handleDelete = (organizationIntegrationId: string, projectIntegrationId: string) => {
    const variables = {
      organization_integration_id: organizationIntegrationId,
      id: projectIntegrationId,
      orgSlug: selectedOrganization?.slug,
    }

    deleteMutate(variables)
  }

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <ScaffoldSectionDetail>
            {detail && <Markdown content={detail} />}
            <img
              className="border rounded-lg shadow w-48 mt-6 border-body"
              src={`${BASE_PATH}/img/integrations/covers/${title.toLowerCase()}-cover.png?v=3`}
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
                      <IntegrationInstallation title={title} key={i} integration={integration} />
                      {integration.connections.length > 0 ? (
                        <>
                          <ConnectionHeading integration={integration} />

                          <ul className="flex flex-col">
                            {integration.connections.map(
                              (connection: IntegrationProjectConnection, i) => (
                                <IntegrationConnection
                                  key={i}
                                  connection={connection}
                                  type={integration.integration.name}
                                  actions={
                                    <Dropdown
                                      side="bottom"
                                      align="end"
                                      size="large"
                                      overlay={
                                        <>
                                          <Dropdown.Item
                                            icon={<IconTrash size={14} />}
                                            onSelect={() =>
                                              handleDelete(integration.id, connection.id)
                                            }
                                          >
                                            Delete
                                          </Dropdown.Item>
                                        </>
                                      }
                                    >
                                      <Button
                                        asChild
                                        iconRight={<IconChevronDown />}
                                        type="default"
                                      >
                                        <span>Manage</span>
                                      </Button>
                                    </Dropdown>
                                  }
                                />
                              )
                            )}
                          </ul>
                        </>
                      ) : (
                        <ConnectionHeading integration={integration} />
                      )}
                      <EmptyIntegrationConnection
                        onClick={() => {
                          snapshot.setOrganizationIntegrationId(integration.id)
                          snapshot.setOpen(true)
                        }}
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
