import { useParams } from 'common'
import { keyBy } from 'lodash'
import Head from 'next/head'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  findVercelIntegrationByConfigurationId,
  isVercelUrl,
} from '@/components/interfaces/Integrations/Vercel/VercelIntegration.utils'
import {
  VERCEL_INTEGRATION_ICON,
  VercelEnvVarsSyncDescription,
  VercelIntegrationFooter,
  VercelIntegrationInterstitialErrorState,
  VercelIntegrationLogo,
} from '@/components/interfaces/Integrations/Vercel/VercelIntegrationInterstitial'
import {
  ProjectLinker,
  type ForeignProject,
} from '@/components/interfaces/Integrations/VercelGithub/ProjectLinker'
import { InterstitialAccountRow, InterstitialLayout } from '@/components/layouts/InterstitialLayout'
import { vercelIcon } from '@/components/to-be-cleaned/ListIcons'
import { useOrgIntegrationsQuery } from '@/data/integrations/integrations-query-org-only'
import { useIntegrationVercelConnectionsCreateMutation } from '@/data/integrations/integrations-vercel-connections-create-mutation'
import { useVercelProjectsQuery } from '@/data/integrations/integrations-vercel-projects-query'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { withAuth } from '@/hooks/misc/withAuth'
import { BASE_PATH } from '@/lib/constants'
import { getErrorMessage } from '@/lib/get-error-message'
import { buildStudioPageTitle } from '@/lib/page-title'
import { useProfileNameAndPicture } from '@/lib/profile'
import { EMPTY_ARR } from '@/lib/void'
import { useIntegrationInstallationSnapshot } from '@/state/integration-installation'
import type { NextPageWithLayout, Organization } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({
  section: 'Connect Vercel Project',
  brand: 'Supabase',
})

const VercelChooseProjectPage: NextPageWithLayout = () => {
  const { slug, configurationId, next } = useParams()
  const { username, primaryEmail, avatarUrl } = useProfileNameAndPicture()
  const displayName = primaryEmail ?? username ?? ''

  const {
    data: integrationData,
    isPending: isLoadingIntegrationsQuery,
    isError: isIntegrationsError,
    error: integrationsError,
  } = useOrgIntegrationsQuery({ orgSlug: slug })

  const {
    data: organizationsData,
    isPending: isLoadingOrganizationsQuery,
    isError: isOrganizationsError,
    error: organizationsError,
  } = useOrganizationsQuery({ enabled: slug !== undefined })

  const organization = organizationsData?.find(
    (organization: Organization) => organization.slug === slug
  )

  const integration = findVercelIntegrationByConfigurationId(integrationData, configurationId)

  const {
    data: vercelProjectsData,
    isPending: isLoadingVercelProjectsData,
    isError: isVercelProjectsError,
    error: vercelProjectsError,
  } = useVercelProjectsQuery(
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
          alt="Framework icon"
        />
      )
    },
    [vercelProjectsById]
  )

  const snapshot = useIntegrationInstallationSnapshot()

  const { mutate: createConnections, isPending: isCreatingConnection } =
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
    (vars: Parameters<typeof createConnections>[0]) => {
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

  const showLoadingState =
    isLoadingOrganizationsQuery ||
    isLoadingIntegrationsQuery ||
    (integration?.id !== undefined && isLoadingVercelProjectsData)

  const isError = isOrganizationsError || isIntegrationsError || isVercelProjectsError
  const errorMessage =
    getErrorMessage(organizationsError) ??
    getErrorMessage(integrationsError) ??
    getErrorMessage(vercelProjectsError)
  const integrationNotFound =
    !isLoadingIntegrationsQuery && integrationData !== undefined && integration === undefined

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>

      <InterstitialLayout
        logo={<VercelIntegrationLogo />}
        title="Connect Vercel project"
        description={<VercelEnvVarsSyncDescription />}
        footer={<VercelIntegrationFooter />}
      >
        <div className="px-6 pb-6">
          {showLoadingState ? (
            <ChooseProjectLoadingState />
          ) : isError ? (
            <VercelIntegrationInterstitialErrorState
              title="Unable to load project connection"
              errorMessage={errorMessage}
            />
          ) : organization === undefined ? (
            <VercelIntegrationInterstitialErrorState
              title="Unable to load project connection"
              errorMessage="Organization not found. Retry the installation from Vercel."
            />
          ) : integrationNotFound ? (
            <VercelIntegrationInterstitialErrorState
              title="Unable to load project connection"
              errorMessage="Vercel integration not found for this organization. Retry the installation from Vercel."
            />
          ) : (
            <div className="flex flex-col gap-5">
              <InterstitialAccountRow
                avatarUrl={avatarUrl}
                displayName={displayName}
                detail={organization.name}
              />

              <ProjectLinker
                variant="interstitial"
                slug={organization.slug}
                organizationIntegrationId={integration?.id}
                foreignProjects={vercelProjects}
                onCreateConnections={onCreateConnections}
                installedConnections={integration?.connections}
                isLoading={isCreatingConnection}
                integrationIcon={VERCEL_INTEGRATION_ICON}
                getForeignProjectIcon={getForeignProjectIcon}
                choosePrompt="Choose Vercel project"
                onSkip={() => {
                  if (next && isVercelUrl(next)) {
                    window.location.href = next
                  }
                }}
                loadingForeignProjects={isLoadingVercelProjectsData}
                mode="Vercel"
              />
            </div>
          )}
        </div>
      </InterstitialLayout>
    </>
  )
}

const ChooseProjectLoadingState = () => (
  <div className="flex flex-col gap-5">
    <Card className="shadow-none">
      <CardContent className="flex items-center gap-3 border-none px-4 py-3">
        <ShimmeringLoader className="size-8 flex-shrink-0 rounded-full py-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <ShimmeringLoader className="h-3 w-20 py-0" />
          <ShimmeringLoader className="h-4 w-40 max-w-full py-0" />
          <ShimmeringLoader className="h-3 w-32 py-0" />
        </div>
      </CardContent>
    </Card>
    <section className="space-y-2" aria-label="Project loading">
      <ShimmeringLoader className="h-3 w-24 py-0" />
      <ShimmeringLoader className="h-[34px] w-full rounded-md py-0" />
    </section>
    <section className="space-y-2" aria-label="Vercel project loading">
      <ShimmeringLoader className="h-3 w-24 py-0" />
      <ShimmeringLoader className="h-[34px] w-full rounded-md py-0" />
    </section>
    <ShimmeringLoader className="h-10 w-full rounded-md py-0" />
  </div>
)

export default withAuth(VercelChooseProjectPage)
