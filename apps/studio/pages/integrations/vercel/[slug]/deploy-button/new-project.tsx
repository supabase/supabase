import { useParams } from 'common'
import Head from 'next/head'
import { useEffect, useState } from 'react'

import { isVercelUrl } from '@/components/interfaces/Integrations/Vercel/VercelIntegration.utils'
import {
  VercelIntegrationFooter,
  VercelIntegrationLogo,
} from '@/components/interfaces/Integrations/Vercel/VercelIntegrationInterstitial'
import { ProjectCreationForm } from '@/components/interfaces/ProjectCreation/ProjectCreationForm'
import { InterstitialLayout } from '@/components/layouts/InterstitialLayout'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useIntegrationsQuery } from '@/data/integrations/integrations-query'
import { useIntegrationVercelConnectionsCreateMutation } from '@/data/integrations/integrations-vercel-connections-create-mutation'
import { useVercelProjectsQuery } from '@/data/integrations/integrations-vercel-projects-query'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'
import { useIntegrationInstallationSnapshot } from '@/state/integration-installation'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({
  section: 'Create Vercel Project',
  brand: 'Supabase',
})

const VercelIntegration: NextPageWithLayout = () => {
  const { slug, next, currentProjectId: foreignProjectId } = useParams()
  const snapshot = useIntegrationInstallationSnapshot()

  const [newProjectRef, setNewProjectRef] = useState<string>()

  const { data: integrationData } = useIntegrationsQuery()
  const organizationIntegration = integrationData?.find((x) => x.organization.slug === slug)

  const { data: organizationData } = useOrganizationsQuery()
  const organization = organizationData?.find((x) => x.slug === slug)

  const { data: vercelProjects } = useVercelProjectsQuery(
    { organization_integration_id: organizationIntegration?.id },
    { enabled: organizationIntegration !== undefined }
  )

  // Wait for the new project to be created before creating the connection
  const { data, isSuccess } = useProjectSettingsV2Query(
    { projectRef: newProjectRef },
    {
      enabled: newProjectRef !== undefined,
      // refetch until the project is created
      refetchInterval: (query) => {
        const data = query.state.data
        return ((data?.service_api_keys ?? []).length ?? 0) > 0 ? false : 1000
      },
    }
  )

  const { mutateAsync: createConnections } = useIntegrationVercelConnectionsCreateMutation()

  useEffect(() => {
    if (!isSuccess) return

    const onSuccessFunc = async () => {
      const isReady = (data.service_api_keys ?? []).length > 0

      if (!isReady || !organizationIntegration || !foreignProjectId || !newProjectRef) {
        return
      }

      const projectDetails = vercelProjects?.find((x) => x.id === foreignProjectId)

      try {
        await createConnections({
          organizationIntegrationId: organizationIntegration?.id,
          connection: {
            foreign_project_id: foreignProjectId,
            supabase_project_ref: newProjectRef,
            integration_id: '0',
            metadata: {
              ...projectDetails,
              supabaseConfig: {
                projectEnvVars: {
                  write: true,
                },
              },
            },
          },
          orgSlug: organization?.slug,
        })
      } catch (error) {
        console.error('An error occurred during createConnections:', error)
        return
      }

      snapshot.setLoading(false)

      if (next && isVercelUrl(next)) window.location.href = next
    }

    onSuccessFunc()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isSuccess])

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>

      <InterstitialLayout
        logo={<VercelIntegrationLogo />}
        title="Create a new project"
        description="Your project will have its own dedicated instance and full Postgres database. An API will be set up so you can easily interact with your new database."
        footer={<VercelIntegrationFooter />}
        widthClassName="max-w-2xl"
      >
        <ProjectCreationForm isVercelIntegrationFlow onCreateSuccess={setNewProjectRef} />
      </InterstitialLayout>
    </>
  )
}

export default withAuth(VercelIntegration)
