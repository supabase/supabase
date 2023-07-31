import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'

import { useParams } from 'common'
import OrganizationPicker from 'components/interfaces/Integrations/OrganizationPicker'
import { Markdown } from 'components/interfaces/Markdown'
import { getHasInstalledObject } from 'components/layouts/IntegrationsLayout/Integrations.utils'
import VercelIntegrationWindowLayout from 'components/layouts/IntegrationsLayout/VercelIntegrationWindowLayout'
import { ScaffoldColumn, ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import { useIntegrationsQuery } from 'data/integrations/integrations-query'
import { useVercelIntegrationCreateMutation } from 'data/integrations/vercel-integration-create-mutation'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useStore } from 'hooks'
import { NextPageWithLayout, Organization } from 'types'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertTriangle,
  IconBook,
  IconInfo,
  IconLifeBuoy,
  LoadingLine,
} from 'ui'

/**
 * Variations of the Vercel integration flow.
 * They require different UI and logic.
 *
 * Deploy Button - the flow that starts from the Deploy Button - https://vercel.com/docs/integrations#deploy-button
 * Marketplace - the flow that starts from the Marketplace - https://vercel.com/integrations
 *
 */
export type VercelIntegrationFlow = 'deploy-button' | 'marketing'

const VercelIntegration: NextPageWithLayout = () => {
  const router = useRouter()
  const { ui } = useStore()
  const { code, configurationId, teamId, source, externalId } = useParams()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [organizationIntegrationId, setOrganizationIntegrationId] = useState<string | null>(null)

  /**
   * Fetch the list of organization based integration installations for Vercel.
   *
   * Array of integrations installed on all
   */
  const { data: integrationData } = useIntegrationsQuery()

  const { data: organizationsData, isLoading: isLoadingOrganizationsQuery } =
    useOrganizationsQuery()

  useEffect(() => {
    if (organizationsData !== undefined && integrationData !== undefined) {
      const firstOrg = organizationsData[0]

      if (firstOrg && selectedOrg === null) {
        setSelectedOrg(firstOrg)
        router.query.organizationSlug = firstOrg.slug
      }
    }
  }, [organizationsData, integrationData])

  /**
   * Organizations with extra `installationInstalled` attribute
   *
   * Used to show label/badge and allow/disallow installing
   *
   */
  const installed = useMemo(
    () =>
      integrationData && organizationsData
        ? getHasInstalledObject({
            integrationName: 'Vercel',
            integrationData,
            organizationsData,
            installationId: configurationId,
          })
        : {},
    [configurationId, integrationData, organizationsData]
  )

  /**
   * Handle the correct route change based on whether the vercel integration
   * is following the 'marketplace' flow or 'deploy button' flow.
   *
   */
  function handleRouteChange() {
    const orgSlug = selectedOrg?.slug

    if (externalId) {
      router.push({
        pathname: `/integrations/vercel/${orgSlug}/deploy-button/new-project`,
        query: router.query,
      })
    } else {
      router.push({
        pathname: `/integrations/vercel/${orgSlug}/marketplace/choose-project`,
        query: router.query,
      })
    }
  }

  const { mutate, isLoading: isLoadingVercelIntegrationCreateMutation } =
    useVercelIntegrationCreateMutation({
      onSuccess({ id }) {
        setOrganizationIntegrationId(id)

        handleRouteChange()
      },
      onError(error: any) {
        ui.setNotification({
          category: 'error',
          message: `Creating Vercel integration failed: ${error.message}`,
        })
      },
    })

  function onInstall() {
    const orgSlug = selectedOrg?.slug

    const isIntegrationInstalled = orgSlug ? installed[orgSlug] : false

    if (!orgSlug) {
      return ui.setNotification({ category: 'error', message: 'Please select an organization' })
    }

    if (!code) {
      return ui.setNotification({ category: 'error', message: 'Vercel code missing' })
    }

    if (!configurationId) {
      return ui.setNotification({ category: 'error', message: 'Vercel Configuration ID missing' })
    }

    if (!source) {
      return ui.setNotification({
        category: 'error',
        message: 'Vercel Configuration source missing',
      })
    }

    /**
     * Only install if integration hasn't already been installed
     */
    if (!isIntegrationInstalled) {
      mutate({
        code,
        configurationId,
        orgSlug,
        metadata: {},
        source,
        teamId: teamId,
      })
    } else {
      handleRouteChange()
    }
  }

  const dataLoading = isLoadingVercelIntegrationCreateMutation || isLoadingOrganizationsQuery

  const disableInstallationForm =
    (isLoadingVercelIntegrationCreateMutation && !dataLoading) ||
    // disables installation button if integration is already installed and it is Marketplace flow
    (selectedOrg && installed[selectedOrg.slug] && source === 'marketplace' && !dataLoading)
      ? true
      : false

  return (
    <>
      <main className="overflow-auto flex flex-col h-full bg">
        <LoadingLine loading={isLoadingVercelIntegrationCreateMutation} />
        {organizationIntegrationId === null && (
          <>
            <ScaffoldContainer className="flex flex-col gap-6 grow py-8">
              <ScaffoldColumn className="mx-auto w-full max-w-md">
                <h1 className="text-xl text-scale-1200">Choose organization</h1>
                <>
                  <Markdown content={`Choose the Supabase organization you wish to install in`} />
                  <OrganizationPicker
                    integrationName="Vercel"
                    selectedOrg={selectedOrg}
                    onSelectedOrgChange={(org) => {
                      setSelectedOrg(org)
                      router.query.organizationSlug = org.slug
                    }}
                    configurationId={configurationId}
                  />
                  {disableInstallationForm && (
                    <Alert_Shadcn_ variant="warning">
                      <IconAlertTriangle className="h-4 w-4" strokeWidth={2} />
                      <AlertTitle_Shadcn_>
                        Vercel Integration is already installed.
                      </AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_>
                        You will need to choose another organization to install the integration.
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
                  )}
                  <div className="flex flex-row w-full justify-end">
                    <Button
                      size="medium"
                      className="self-end"
                      disabled={disableInstallationForm || isLoadingVercelIntegrationCreateMutation}
                      loading={isLoadingVercelIntegrationCreateMutation}
                      onClick={onInstall}
                    >
                      Install integration
                    </Button>
                  </div>
                </>
              </ScaffoldColumn>
            </ScaffoldContainer>
            <ScaffoldContainer className="flex flex-col gap-6 py-3">
              <Alert_Shadcn_ variant="default">
                <IconInfo className="h-4 w-4" strokeWidth={2} />
                <AlertTitle_Shadcn_>
                  You can uninstall this Integration at any time.
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  Remove this integration at any time via Vercel or the Supabase dashboard.
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            </ScaffoldContainer>
          </>
        )}

        <ScaffoldDivider />
      </main>
      <ScaffoldContainer className="bg-body flex flex-row gap-6 py-6">
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

VercelIntegration.getLayout = (page) => (
  <VercelIntegrationWindowLayout>{page}</VercelIntegrationWindowLayout>
)

export default VercelIntegration
