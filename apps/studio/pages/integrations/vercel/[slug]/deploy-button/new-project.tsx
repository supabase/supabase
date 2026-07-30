import { useParams } from 'common'
import Head from 'next/head'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

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
  const [connectionError, setConnectionError] = useState<string>()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnectionComplete, setIsConnectionComplete] = useState(false)

  const { data: integrationData } = useIntegrationsQuery()
  const organizationIntegration = integrationData?.find((x) => x.organization.slug === slug)

  const { data: organizationData } = useOrganizationsQuery()
  const organization = organizationData?.find((x) => x.slug === slug)

  const { data: vercelProjects } = useVercelProjectsQuery(
    { organization_integration_id: organizationIntegration?.id },
    { enabled: organizationIntegration !== undefined }
  )

  // Wait for the new project to be created before creating the connection
  const {
    data,
    isSuccess,
    isError: isProjectSettingsError,
    error: projectSettingsError,
    refetch: refetchProjectSettings,
  } = useProjectSettingsV2Query(
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

  const connectProject = useCallback(async () => {
    const isReady = (data?.service_api_keys ?? []).length > 0

    if (!isReady || !organizationIntegration || !foreignProjectId || !newProjectRef) {
      return
    }

    const projectDetails = vercelProjects?.find((x) => x.id === foreignProjectId)
    setConnectionError(undefined)
    setIsConnecting(true)

    try {
      await createConnections({
        organizationIntegrationId: organizationIntegration.id,
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
      snapshot.setLoading(false)
      setIsConnectionComplete(true)
      if (next && isVercelUrl(next)) window.location.href = next
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred'
      setConnectionError(message)
    } finally {
      setIsConnecting(false)
    }
  }, [
    createConnections,
    data?.service_api_keys,
    foreignProjectId,
    newProjectRef,
    next,
    organization?.slug,
    organizationIntegration,
    snapshot,
    vercelProjects,
  ])

  useEffect(() => {
    if (isSuccess && !connectionError && !isConnecting && !isConnectionComplete) {
      void connectProject()
    }
  }, [connectProject, connectionError, isConnecting, isConnectionComplete, isSuccess])

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
        {newProjectRef === undefined ? (
          <ProjectCreationForm isVercelIntegrationFlow onCreateSuccess={setNewProjectRef} />
        ) : (
          <div className="px-6 pb-6">
            {isProjectSettingsError ? (
              <VercelConnectionError
                projectRef={newProjectRef}
                message={
                  projectSettingsError?.message ?? 'Unable to check whether the project is ready.'
                }
                onRetry={() => void refetchProjectSettings()}
              />
            ) : connectionError ? (
              <VercelConnectionError
                projectRef={newProjectRef}
                message={connectionError}
                onRetry={() => void connectProject()}
              />
            ) : isConnectionComplete ? (
              <div className="flex flex-col gap-3">
                <Admonition
                  type="success"
                  title="Project connected"
                  description="Your Supabase project is connected to Vercel."
                />
                <Button asChild variant="primary" block>
                  <Link href={`/project/${newProjectRef}`}>Open project</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3" role="status">
                <p className="text-sm text-foreground-light">
                  {isConnecting
                    ? 'Connecting your project to Vercel'
                    : 'Waiting for your project to be ready'}
                </p>
                <ShimmeringLoader className="h-2 w-full rounded-full py-0" />
              </div>
            )}
          </div>
        )}
      </InterstitialLayout>
    </>
  )
}

export function VercelConnectionError({
  projectRef,
  message,
  onRetry,
}: {
  projectRef: string
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <Admonition
        type="danger"
        title="Project created, connection failed"
        description={
          <>
            Your Supabase project was created, but it could not be connected to Vercel.
            <span className="mt-1 block text-foreground-lighter">Error: {message}</span>
          </>
        }
      />
      <Button variant="primary" block onClick={onRetry}>
        Retry connection
      </Button>
      <Button asChild variant="text" block>
        <Link href={`/project/${projectRef}`}>Open project</Link>
      </Button>
    </div>
  )
}

export default withAuth(VercelIntegration)
