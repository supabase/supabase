import { keyBy } from 'lodash'
import { useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { ENV_VAR_RAW_KEYS } from 'components/interfaces/Integrations/Integrations-Vercel.constants'
import ProjectLinker, { ForeignProject } from 'components/interfaces/Integrations/ProjectLinker'
import { Markdown } from 'components/interfaces/Markdown'
import { vercelIcon } from 'components/to-be-cleaned/ListIcons'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useIntegrationVercelConnectionsCreateMutation } from 'data/integrations/integrations-vercel-connections-create-mutation'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { BASE_PATH } from 'lib/constants'
import { EMPTY_ARR } from 'lib/void'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import { SidePanel } from 'ui'

const VERCEL_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 512 512" className="w-6">
    <path fill-rule="evenodd" d="M256,48,496,464H16Z" />
  </svg>
)

const SidePanelVercelProjectLinker = () => {
  const { ref } = useParams()
  const selectedOrganization = useSelectedOrganization()
  const sidePanelStateSnapshot = useSidePanelsStateSnapshot()
  const organizationIntegrationId = sidePanelStateSnapshot.vercelConnectionsIntegrationId

  const { data: integrationData } = useOrgIntegrationsQuery({
    orgSlug: selectedOrganization?.slug,
  })
  const vercelIntegrations = integrationData?.filter(
    (integration) => integration.integration.name === 'Vercel'
  ) // vercel

  /**
   * Find the right integration
   *
   * we use the snapshot.organizationIntegrationId which should be set whenever this sidepanel is opened
   */
  const selectedIntegration = vercelIntegrations?.find((x) => x.id === organizationIntegrationId)

  /**
   * Supabase projects available
   */
  const { data: supabaseProjectsData } = useProjectsQuery({
    enabled: organizationIntegrationId !== undefined,
  })

  const supabaseProjects = useMemo(
    () =>
      supabaseProjectsData
        ?.filter((project) => project.organization_id === selectedOrganization?.id)
        .map((project) => ({ name: project.name, ref: project.ref })) ?? EMPTY_ARR,
    [selectedOrganization?.id, supabaseProjectsData]
  )

  const { data: vercelProjectsData } = useVercelProjectsQuery(
    {
      organization_integration_id: organizationIntegrationId,
    },
    { enabled: organizationIntegrationId !== undefined }
  )

  const vercelProjects = useMemo(() => vercelProjectsData ?? EMPTY_ARR, [vercelProjectsData])
  const vercelProjectsById = useMemo(() => keyBy(vercelProjects, 'id'), [vercelProjects])

  const getForeignProjectIcon = useCallback(
    (_project: ForeignProject) => {
      const project = vercelProjectsById[_project.id]

      return !project?.framework ? (
        vercelIcon
      ) : (
        <img
          src={`${BASE_PATH}/img/icons/frameworks/${project.framework}.svg`}
          width={21}
          height={21}
          alt={`icon`}
        />
      )
    },
    [vercelProjectsById]
  )

  const { mutate: createConnections, isLoading: isCreatingConnection } =
    useIntegrationVercelConnectionsCreateMutation({
      async onSuccess({ env_sync_error: envSyncError }) {
        if (envSyncError) {
          toast.error(
            `Failed to sync environment variables: ${envSyncError.message}. Please try re-syncing manually from settings.`
          )
        }

        sidePanelStateSnapshot.setVercelConnectionsOpen(false)
      },
    })

  const onCreateConnections = useCallback(
    (vars: any) => {
      createConnections({
        ...vars,
        connection: {
          ...vars.connection,
          metadata: {
            ...vars.connection.metadata,
            supabaseConfig: {
              projectEnvVars: {
                write: true,
              },
            },
          },
        },
      })
    },
    [createConnections]
  )

  return (
    <SidePanel
      hideFooter
      size="large"
      header="Add new Vercel project connection"
      visible={sidePanelStateSnapshot.vercelConnectionsOpen}
      onCancel={() => sidePanelStateSnapshot.setVercelConnectionsOpen(false)}
    >
      <div className="py-6 flex flex-col gap-6 bg-studio h-full">
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
            defaultSupabaseProjectRef={ref}
            organizationIntegrationId={selectedIntegration?.id}
            foreignProjects={vercelProjects}
            supabaseProjects={supabaseProjects}
            onCreateConnections={onCreateConnections}
            installedConnections={selectedIntegration?.connections}
            isLoading={isCreatingConnection}
            integrationIcon={VERCEL_ICON}
            getForeignProjectIcon={getForeignProjectIcon}
            choosePrompt="Choose Vercel Project"
            mode="Vercel"
          />
          <Markdown
            content={`
The following environment variables will be added:

${ENV_VAR_RAW_KEYS.map((x) => {
  return `\n - \`${x}\``
})}
`}
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
