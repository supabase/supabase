import { useMemo } from 'react'

import ProjectLinker from 'components/interfaces/Integrations/ProjectLinker'
import { Markdown } from 'components/interfaces/Markdown'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization } from 'hooks'
import { EMPTY_ARR } from 'lib/void'
import { useGithubConnectionConfigPanelSnapshot } from 'state/github-connection-config-panel'
import { SidePanel } from 'ui'

const SidePanelVercelProjectLinker = () => {
  const selectedOrganization = useSelectedOrganization()

  const { data: integrationData } = useOrgIntegrationsQuery({
    orgSlug: selectedOrganization?.slug,
  })
  const vercelIntegrations = integrationData?.filter(
    (integration) => integration.integration.name === 'Vercel'
  ) // vercel

  const snapshot = useGithubConnectionConfigPanelSnapshot()

  /**
   * Find the right integration
   *
   * we use the snapshot.organizationIntegrationId which should be set whenever this sidepanel is opened
   */
  const selectedIntegration = vercelIntegrations?.find(
    (x) => x.id === snapshot.organizationIntegrationId
  )

  const organizationIntegrationId = snapshot.organizationIntegrationId
  const open = snapshot.open

  /**
   * iEchor projects available
   */
  const { data: supabaseProjectsData } = useProjectsQuery({
    enabled: organizationIntegrationId !== undefined,
  })

  const supabaseProjects = useMemo(
    () =>
      supabaseProjectsData
        ?.filter((project) => project.organization_id === selectedOrganization?.id)
        .map((project) => ({ id: project.id.toString(), name: project.name, ref: project.ref })) ??
      EMPTY_ARR,
    [selectedOrganization?.id, supabaseProjectsData]
  )

  const { data: vercelProjectsData } = useVercelProjectsQuery(
    {
      organization_integration_id: organizationIntegrationId,
    },
    { enabled: organizationIntegrationId !== undefined }
  )

  const vercelProjects = useMemo(() => vercelProjectsData ?? EMPTY_ARR, [vercelProjectsData])

  return (
    <SidePanel
      header={'Add GitHub repository'}
      size="large"
      visible={open}
      hideFooter
      onCancel={() => snapshot.setOpen(false)}
    >
      <div className="py-10 flex flex-col gap-6 bg-body h-full">
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
            organizationIntegrationId={selectedIntegration?.id}
            foreignProjects={vercelProjects}
            supabaseProjects={supabaseProjects}
            onCreateConnections={() => {
              snapshot.setOpen(false)
            }}
            installedConnections={selectedIntegration?.connections}
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

export default SidePanelVercelProjectLinker
