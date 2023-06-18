import { useParams } from 'common'
import ProjectLinker from 'components/interfaces/Integrations/ProjectLinker'
import { Markdown } from 'components/interfaces/Markdown'
import { useIntegrationsQuery } from 'data/integrations/integrations-query'
import { useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import { useMemo, useState } from 'react'
import { useGithubConnectionConfigPanelSnapshot } from 'state/github-connection-config-panel'
import { SidePanel } from 'ui'

import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { EMPTY_ARR } from 'lib/void'
import { Organization } from 'types'
import { useVercelProjectConnectionsQuery } from 'data/integrations/integrations-vercel-installed-connections-query'

const SidePanelVercelProjectLinker = () => {
  const { ui } = useStore()
  const { slug } = useParams()
  const { data } = useIntegrationsQuery({ orgSlug: slug })

  const vercelIntegrations = data?.filter((integration) => integration.integration.id === 1) // vercel

  const selectedOrg = ui.selectedOrganization

  const [organizationIntegrationId, setOrganizationIntegrationId] = useState<string>(
    '880cb835-54b4-415b-8178-6f7920fdc40d'
  )

  const githubConnectionConfigPanelSnapshot = useGithubConnectionConfigPanelSnapshot()

  const { data: supabaseProjectsData } = useProjectsQuery({
    enabled: organizationIntegrationId !== null,
  })
  const supabaseProjects = useMemo(
    () =>
      supabaseProjectsData
        ?.filter((project) => project.organization_id === selectedOrg?.id)
        .map((project) => ({ id: project.id.toString(), name: project.name })) ?? EMPTY_ARR,
    [selectedOrg?.id, supabaseProjectsData]
  )

  const { data: vercelProjectConnectionsData } = useVercelProjectConnectionsQuery(
    {
      organization_integration_id: organizationIntegrationId,
    },
    { enabled: organizationIntegrationId !== null }
  )

  const vercelProjectConnections = useMemo(
    () => vercelProjectConnectionsData ?? EMPTY_ARR,
    [vercelProjectConnectionsData]
  )

  const { data: vercelProjectsData } = useVercelProjectsQuery(
    {
      orgId: selectedOrg?.id,
      orgSlug: selectedOrg?.slug,
    },
    { enabled: organizationIntegrationId !== null }
  )

  console.log('vercelProjectsData', vercelProjectsData)
  const vercelProjects = useMemo(() => vercelProjectsData ?? EMPTY_ARR, [vercelProjectsData])

  return (
    <SidePanel
      header={'Add GitHub repository'}
      size="large"
      visible={githubConnectionConfigPanelSnapshot.visible}
      onCancel={() => githubConnectionConfigPanelSnapshot.setVisible(false)}
    >
      <div className="my-10 flex flex-col gap-6">
        <SidePanel.Content>
          <Markdown
            content={`
### Choose repository to connect to

Check the details below before proceeding
          `}
          />
        </SidePanel.Content>
        <SidePanel.Content className="flex flex-col gap-2">
          <ProjectLinker
            organizationIntegrationId={'880cb835-54b4-415b-8178-6f7920fdc40d'}
            foreignProjects={vercelProjects}
            supabaseProjects={supabaseProjects}
            onCreateConnections={() => {
              // if (next) {
              //   window.location.href = next
              // }
            }}
            installedConnections={vercelProjectConnections}
          />
        </SidePanel.Content>
        <SidePanel.Content>
          <ul>
            <li className="border px-10">
              {/* <IntegrationConnectionOption connection={githubIntegrations[0]} /> */}
            </li>
          </ul>
        </SidePanel.Content>
      </div>
    </SidePanel>
  )
}

export default observer(SidePanelVercelProjectLinker)
