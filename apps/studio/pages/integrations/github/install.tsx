import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'

import { useParams } from 'common'
import OrganizationPicker from 'components/interfaces/Integrations/OrganizationPicker'
import { Markdown } from 'components/interfaces/Markdown'
import GitHubIntegrationWindowLayout from 'components/layouts/IntegrationsLayout/GitHubIntegrationWindowLayout'
import { getHasInstalledObject } from 'components/layouts/IntegrationsLayout/Integrations.utils'
import { ScaffoldColumn, ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import { useGitHubIntegrationCreateMutation } from 'data/integrations/github-integration-create-mutation'
import { useIntegrationsQuery } from 'data/integrations/integrations-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useStore } from 'hooks'
import { NextPageWithLayout, Organization } from 'types'
import {
  Alert,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertTriangle,
  IconBook,
  IconLifeBuoy,
  LoadingLine,
} from 'ui'
import { useGitHubIntegrationAutoInstall } from 'lib/github-integration'

const GitHubIntegration: NextPageWithLayout = () => {
  const router = useRouter()
  const { ui } = useStore()
  const { installation_id: installationId } = useParams()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)

  /**
   * Fetch the list of organization based integration installations for GitHub.
   *
   * Array of integrations installed on all
   */
  const { data: integrationData } = useIntegrationsQuery()

  const { data: organizationsData } = useOrganizationsQuery({
    onSuccess(organizations) {
      const firstOrg = organizations?.[0]
      if (firstOrg && selectedOrg === null) {
        setSelectedOrg(firstOrg)
        router.query.organizationSlug = firstOrg.slug
      }
    },
  })

  const onInstalled = useCallback(
    (id: string, orgSlug?: string) => {
      router.push({
        pathname: `/integrations/github/${id}/choose-project`,
        query: { ...router.query, slug: orgSlug },
      })
    },
    [router]
  )

  const { mutate, isLoading: isLoadingGitHubIntegrationCreateMutation } =
    useGitHubIntegrationCreateMutation({
      onSuccess({ id }) {
        onInstalled(id, selectedOrg?.slug)
      },
    })

  const isAutoInstalling = useGitHubIntegrationAutoInstall(onInstalled)

  const installed = useMemo(
    () =>
      integrationData && organizationsData
        ? getHasInstalledObject({
            integrationName: 'GitHub',
            integrationData,
            organizationsData,
            installationId,
          })
        : {},
    [installationId, integrationData, organizationsData]
  )

  function onInstall() {
    const orgSlug = selectedOrg?.slug

    const installedIntegration = integrationData?.find(
      (x) =>
        x.organization.slug === orgSlug &&
        x.metadata !== undefined &&
        'installation_id' in x.metadata &&
        String(x.metadata?.installation_id) === String(installationId)
    )
    const isIntegrationInstalled = Boolean(installedIntegration)

    if (!orgSlug) {
      return ui.setNotification({ category: 'error', message: 'Please select an organization' })
    }

    if (!installationId) {
      return ui.setNotification({ category: 'error', message: 'GitHub Installation ID is missing' })
    }

    /**
     * Only install if instgration hasn't already been installed
     */
    if (!isIntegrationInstalled) {
      mutate({
        installationId: Number(installationId),
        orgSlug,
        metadata: {
          supabaseConfig: {
            supabaseDirectory: '/supabase',
          },
        },
      })
    } else {
      router.push({
        pathname: `/integrations/github/${installedIntegration?.id}/choose-project`,
        query: router.query,
      })
    }
  }

  const disableInstallationForm = Boolean(selectedOrg && installed[selectedOrg.slug])

  return (
    <>
      <main className="overflow-auto flex flex-col h-full bg">
        <LoadingLine loading={isLoadingGitHubIntegrationCreateMutation || isAutoInstalling} />
        <ScaffoldContainer className="flex flex-col gap-6 grow py-8">
          <ScaffoldColumn className="mx-auto">
            <h1 className="text-xl text-foreground">Choose organization</h1>
            <>
              <Markdown content={`Choose the Supabase organization you wish to install in`} />
              <OrganizationPicker
                integrationName="GitHub"
                selectedOrg={selectedOrg}
                onSelectedOrgChange={(org) => {
                  router.query.organizationSlug = org.slug
                  setSelectedOrg(org)
                }}
                configurationId={installationId}
              />
              {disableInstallationForm && (
                <Alert_Shadcn_ variant="warning">
                  <IconAlertTriangle className="h-4 w-4" strokeWidth={2} />
                  <AlertTitle_Shadcn_>GitHub Integration is already installed.</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    You will need to choose another organization to install the integration.
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              )}
              <div className="flex flex-row w-full justify-end">
                <Button
                  size="medium"
                  className="self-end"
                  disabled={
                    isLoadingGitHubIntegrationCreateMutation ||
                    isAutoInstalling ||
                    disableInstallationForm
                  }
                  loading={isLoadingGitHubIntegrationCreateMutation || isAutoInstalling}
                  onClick={onInstall}
                >
                  Install integration
                </Button>
              </div>
            </>
          </ScaffoldColumn>
        </ScaffoldContainer>
        <ScaffoldContainer className="flex flex-col gap-6 py-3">
          <Alert withIcon variant="info" title="You can uninstall this Integration at any time.">
            <Markdown
              content={`Remove this integration at any time via GitHub or the Supabase dashboard.`}
            />
          </Alert>
        </ScaffoldContainer>

        <ScaffoldDivider />
      </main>
      <ScaffoldContainer className="bg-background flex flex-row gap-6 py-6">
        <div className="flex items-center gap-2 text-xs text-foreground-lighter">
          <IconBook size={16} /> Docs
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground-lighter">
          <IconLifeBuoy size={16} /> Support
        </div>
      </ScaffoldContainer>
    </>
  )
}

GitHubIntegration.getLayout = (page) => (
  <GitHubIntegrationWindowLayout>{page}</GitHubIntegrationWindowLayout>
)

export default GitHubIntegration
