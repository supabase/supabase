import { keyBy } from 'lodash'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ENV_VAR_RAW_KEYS } from 'components/interfaces/Integrations/Vercel/Integrations-Vercel.constants'
import { isVercelUrl } from 'components/interfaces/Integrations/Vercel/VercelIntegration.utils'
import ProjectLinker, {
  ForeignProject,
} from 'components/interfaces/Integrations/VercelGithub/ProjectLinker'
import { Markdown } from 'components/interfaces/Markdown'
import VercelIntegrationWindowLayout from 'components/layouts/IntegrationsLayout/VercelIntegrationWindowLayout'
import { ScaffoldColumn, ScaffoldContainer } from 'components/layouts/Scaffold'
import { vercelIcon } from 'components/to-be-cleaned/ListIcons'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useIntegrationVercelConnectionsCreateMutation } from 'data/integrations/integrations-vercel-connections-create-mutation'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { BASE_PATH, PROJECT_STATUS } from 'lib/constants'
import { EMPTY_ARR } from 'lib/void'
import { useIntegrationInstallationSnapshot } from 'state/integration-installation'
import type { NextPageWithLayout, Organization } from 'types'

const VERCEL_ICON = (
  <img src={`${BASE_PATH}/img/icons/vercel-icon.svg`} alt="Vercel Icon" className="w-4" />
)

const VercelIntegration: NextPageWithLayout = () => {
  const { slug, configurationId, next } = useParams()

  /**
   * Fetch the list of organization based integration installations for Vercel.
   *
   * Array of integrations installed on all
   */
  const { data: integrationData, isLoading: integrationDataLoading } = useOrgIntegrationsQuery({
    orgSlug: slug,
  })

  const { data, isLoading: isLoadingOrganizationsQuery } = useOrganizationsQuery({
    enabled: slug !== undefined,
  })

  const organization = data?.find((organization: Organization) => organization.slug === slug)

  const integration = integrationData?.find(
    (x) =>
      x.metadata !== undefined &&
      'configuration_id' in x.metadata &&
      x.metadata?.configuration_id === configurationId
  )

  const { data: supabaseProjectsData, isLoading: isLoadingSupabaseProjectsData } = useProjectsQuery(
    {
      enabled: integration?.id !== undefined,
    }
  )

  const supabaseProjects = useMemo(
    () =>
      supabaseProjectsData
        ?.filter(
          (project) =>
            project.organization_id === organization?.id &&
            (project.status === PROJECT_STATUS['ACTIVE_HEALTHY'] ||
              project.status === PROJECT_STATUS['COMING_UP'] ||
              project.status === PROJECT_STATUS['RESTORING'] ||
              project.status === PROJECT_STATUS['RESTARTING'] ||
              project.status === PROJECT_STATUS['RESIZING'])
        )
        .map((project) => ({ name: project.name, ref: project.ref })) ?? EMPTY_ARR,
    [organization?.id, supabaseProjectsData]
  )

  const { data: vercelProjectsData, isLoading: isLoadingVercelProjectsData } =
    useVercelProjectsQuery(
      {
        organization_integration_id: integration?.id,
      },
      { enabled: integration?.id !== undefined }
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

  const snapshot = useIntegrationInstallationSnapshot()

  const { mutate: createConnections, isLoading: isCreatingConnection } =
    useIntegrationVercelConnectionsCreateMutation({
      onSuccess() {
        if (next && isVercelUrl(next)) {
          snapshot.setLoading(false)
          window.location.href = next
        }
      },
      onMutate() {
        snapshot.setLoading(true)
      },
      onError(error) {
        snapshot.setLoading(false)
        toast.error(`Creating connection failed: ${error.message}`)
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
    <>
      <ScaffoldContainer className="flex flex-col gap-6 grow py-8">
        <ScaffoldColumn className="!max-w-[900px] mx-auto w-full">
          <header>
            <h2>Create your first Project Connection</h2>
            <Markdown
              className="text-foreground-lighter"
              content={`
This Supabase integration manages your environment variables automatically to provide the latest keys in the unlikely event that you will need to refresh your JWT token.
`}
            />
          </header>
          <ProjectLinker
            organizationIntegrationId={integration?.id}
            foreignProjects={vercelProjects}
            supabaseProjects={supabaseProjects}
            onCreateConnections={onCreateConnections}
            installedConnections={integration?.connections}
            isLoading={isCreatingConnection}
            integrationIcon={VERCEL_ICON}
            getForeignProjectIcon={getForeignProjectIcon}
            choosePrompt="Choose Vercel Project"
            onSkip={() => {
              if (next && isVercelUrl(next)) {
                window.location.href = next
              }
            }}
            loadingForeignProjects={isLoadingVercelProjectsData}
            loadingSupabaseProjects={isLoadingSupabaseProjectsData}
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
        </ScaffoldColumn>
      </ScaffoldContainer>
    </>
  )
}

VercelIntegration.getLayout = (page) => (
  <VercelIntegrationWindowLayout>{page}</VercelIntegrationWindowLayout>
)

export default VercelIntegration
