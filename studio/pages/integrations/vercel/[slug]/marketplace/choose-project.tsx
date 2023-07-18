import { keyBy } from 'lodash'
import { useCallback, useMemo } from 'react'

import { useParams } from 'common'
import ProjectLinker, { ForeignProject } from 'components/interfaces/Integrations/ProjectLinker'
import { Markdown } from 'components/interfaces/Markdown'
import { VercelIntegrationLayout } from 'components/layouts'
import { ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import { vercelIcon } from 'components/to-be-cleaned/ListIcons'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useIntegrationVercelConnectionsCreateMutation } from 'data/integrations/integrations-vercel-connections-create-mutation'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { BASE_PATH } from 'lib/constants'
import { EMPTY_ARR } from 'lib/void'

import { NextPageWithLayout, Organization } from 'types'
import { IconBook, IconLifeBuoy, LoadingLine } from 'ui'
import { ENV_VAR_RAW_KEYS } from 'components/interfaces/Integrations/Integrations-Vercel.constants'
import { useIntegrationsVercelConnectionSyncEnvsMutation } from 'data/integrations/integrations-vercel-connection-sync-envs-mutation'
import { toast } from 'react-hot-toast'

const VERCEL_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 512 512" className="w-6">
    <path fill-rule="evenodd" d="M256,48,496,464H16Z" />
  </svg>
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

  const { data: supabaseProjectsData } = useProjectsQuery({
    enabled: integration?.id !== undefined,
  })

  const supabaseProjects = useMemo(
    () =>
      supabaseProjectsData
        ?.filter((project) => project.organization_id === organization?.id)
        .map((project) => ({ id: project.id.toString(), name: project.name, ref: project.ref })) ??
      EMPTY_ARR,
    [organization?.id, supabaseProjectsData]
  )

  const { data: vercelProjectsData } = useVercelProjectsQuery(
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
      <main className="overflow-auto flex flex-col h-full">
        <LoadingLine loading={isCreatingConnection} />
        <>
          <ScaffoldContainer className="flex flex-col gap-6 grow py-8">
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
