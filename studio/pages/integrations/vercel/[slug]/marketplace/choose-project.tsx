import { keyBy } from 'lodash'
import { useCallback, useMemo } from 'react'
import { toast } from 'react-hot-toast'

import { useParams } from 'common'
import { ENV_VAR_RAW_KEYS } from 'components/interfaces/Integrations/Integrations-Vercel.constants'
import ProjectLinker, { ForeignProject } from 'components/interfaces/Integrations/ProjectLinker'
import { Markdown } from 'components/interfaces/Markdown'
import { VercelIntegrationLayout } from 'components/layouts'
import { ScaffoldColumn, ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import { vercelIcon } from 'components/to-be-cleaned/ListIcons'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useIntegrationsVercelConnectionSyncEnvsMutation } from 'data/integrations/integrations-vercel-connection-sync-envs-mutation'
import { useIntegrationVercelConnectionsCreateMutation } from 'data/integrations/integrations-vercel-connections-create-mutation'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { BASE_PATH } from 'lib/constants'
import { EMPTY_ARR } from 'lib/void'
import { NextPageWithLayout, Organization } from 'types'
import { IconBook, IconLifeBuoy, LoadingLine } from 'ui'

const VERCEL_ICON = (
  <img src={`${BASE_PATH}/img/icons/vercel-icon.svg`} alt="Vercel Icon" className="w-4" />
)

const VercelIntegration: NextPageWithLayout = () => {
  const { slug, configurationId, next, organizationSlug } = useParams()

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
        ?.filter((project) => project.organization_id === organization?.id)
        .map((project) => ({ id: project.id.toString(), name: project.name, ref: project.ref })) ??
      EMPTY_ARR,
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

  const { mutateAsync: syncEnvs } = useIntegrationsVercelConnectionSyncEnvsMutation()
  const { mutate: createConnections, isLoading: isCreatingConnection } =
    useIntegrationVercelConnectionsCreateMutation({
      async onSuccess({ id }) {
        try {
          await syncEnvs({ connectionId: id })
        } catch (error: any) {
          toast.error('Failed to sync environment variables: ', error.message)
        }

        if (next) {
          window.location.href = next
        }
      },
    })

  const onCreateConnections = useCallback(
    (vars) => {
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
      <LoadingLine loading={isCreatingConnection} />
      <main className="overflow-auto flex flex-col h-full">
        <>
          <ScaffoldContainer className="flex flex-col gap-6 grow py-8">
            <ScaffoldColumn className="!max-w-[900px] mx-auto w-full">
              <header>
                <h1 className="text-xl text-scale-1200">
                  Link a Supabase project to a Vercel project
                </h1>
                <Markdown
                  className="text-scale-900"
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
                  if (next) {
                    window.location.href = next
                  }
                }}
                loadingForeignProjects={isLoadingVercelProjectsData}
                loadingSupabaseProjects={isLoadingSupabaseProjectsData}
              />
              <Markdown
                content={`
The following environment variables will be added:

${ENV_VAR_RAW_KEYS.map((x) => {
  return `
  \n
  - \`${x}\`
`
})}
`}
              />
            </ScaffoldColumn>
          </ScaffoldContainer>
        </>

        <ScaffoldDivider />
      </main>
      <ScaffoldContainer className="bg-body flex flex-row gap-6 py-6 border-t">
        <div className="flex items-center gap-2 text-xs text-scale-900">
          <IconBook size={16} /> Docs
        </div>
        <div className="flex items-center gap-2 text-xs text-scale-900">
          <IconLifeBuoy size={16} /> Support
        </div>
      </ScaffoldContainer>
    </>
  )
}

VercelIntegration.getLayout = (page) => <VercelIntegrationLayout>{page}</VercelIntegrationLayout>

export default VercelIntegration
