import { useParams } from 'common'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  VercelIntegrationFooter,
  VercelIntegrationInterstitialErrorState,
  VercelIntegrationLogo,
} from '@/components/interfaces/Integrations/Vercel/VercelIntegrationInterstitial'
import { getHasInstalledObject } from '@/components/layouts/IntegrationsLayout/Integrations.utils'
import { InterstitialAccountRow, InterstitialLayout } from '@/components/layouts/InterstitialLayout'
import { useIntegrationsQuery } from '@/data/integrations/integrations-query'
import { useVercelIntegrationCreateMutation } from '@/data/integrations/vercel-integration-create-mutation'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { withAuth } from '@/hooks/misc/withAuth'
import {
  buildVercelInstallRouteQuery,
  getErrorMessage,
  getVercelInstallSource,
} from '@/lib/integrations/vercel-install.utils'
import { buildStudioPageTitle } from '@/lib/page-title'
import { useProfileNameAndPicture } from '@/lib/profile'
import { useTrack } from '@/lib/telemetry/track'
import { useIntegrationInstallationSnapshot } from '@/state/integration-installation'
import type { NextPageWithLayout, Organization } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({
  section: 'Install Vercel Integration',
  brand: 'Supabase',
})

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
  const { code, configurationId, currentProjectId, externalId, next, teamId, source } = useParams()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const { username, primaryEmail, avatarUrl } = useProfileNameAndPicture()
  const track = useTrack()

  const snapshot = useIntegrationInstallationSnapshot()
  const displayName = primaryEmail ?? username ?? ''

  /**
   * Fetch the list of organization based integration installations for Vercel.
   *
   * Array of integrations installed on all
   */
  const {
    data: integrationData,
    isPending: isLoadingIntegrationsQuery,
    isError: isIntegrationsError,
    error: integrationsError,
  } = useIntegrationsQuery()

  const {
    data: organizationsData,
    isPending: isLoadingOrganizationsQuery,
    isSuccess: isOrganizationsDataSuccess,
    isError: isOrganizationsError,
    error: organizationsError,
  } = useOrganizationsQuery()

  useEffect(() => {
    if (organizationsData !== undefined && integrationData !== undefined) {
      const firstOrg = organizationsData[0]

      if (firstOrg && selectedOrg === null) {
        setSelectedOrg(firstOrg)
      }
    }
  }, [organizationsData, integrationData, selectedOrg])

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
   * is following the 'marketplace/external' flow or 'deploy button' flow.
   * See:
   * - https://vercel.com/docs/integrations/create-integration/submit-integration#query-parameters-for-marketplace
   * - https://vercel.com/docs/integrations/create-integration/submit-integration#query-parameters-for-external-flow
   * - https://vercel.com/docs/integrations/create-integration/submit-integration#query-parameters-for-deploy-button
   */
  function handleRouteChange() {
    const orgSlug = selectedOrg?.slug
    const vercelInstallSource = getVercelInstallSource(source)
    const query = buildVercelInstallRouteQuery({
      source: vercelInstallSource,
      organizationSlug: orgSlug,
      configurationId,
      currentProjectId,
      externalId,
      next,
    })

    switch (vercelInstallSource) {
      case 'deploy-button': {
        router.push({
          pathname: `/integrations/vercel/${orgSlug}/deploy-button/new-project`,
          query,
        })
        break
      }
      case 'marketplace':
      case 'external': {
        router.push({
          pathname: `/integrations/vercel/${orgSlug}/marketplace/choose-project`,
          query,
        })
        break
      }
      default:
        toast.error(
          `Unsupported Vercel installation source: ${source}. Please contact support if this error persists.`
        )
    }
  }

  const { mutate, isPending: isLoadingVercelIntegrationCreateMutation } =
    useVercelIntegrationCreateMutation({
      onMutate() {
        snapshot.setLoading(true)
      },
      onSuccess() {
        handleRouteChange()
        snapshot.setLoading(false)
      },
      onError(error) {
        snapshot.setLoading(false)
        toast.error(`Creating Vercel integration failed: ${error.message}`)
      },
    })

  function onInstall() {
    const orgSlug = selectedOrg?.slug

    const isIntegrationInstalled = orgSlug ? installed[orgSlug] : false

    if (!orgSlug) {
      return toast.error('Please select an organization')
    }

    if (!code) {
      return toast.error('Vercel code missing')
    }

    if (!configurationId) {
      return toast.error('Vercel Configuration ID missing')
    }

    if (!source) {
      return toast.error('Vercel Configuration source missing')
    }

    /**
     * Only install if integration hasn't already been installed
     */
    if (!isIntegrationInstalled) {
      track(
        'integration_install_submitted',
        { integrationName: 'Vercel', method: source },
        { organization: orgSlug }
      )
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

  const dataLoading =
    isLoadingVercelIntegrationCreateMutation ||
    isLoadingOrganizationsQuery ||
    isLoadingIntegrationsQuery

  const noOrganizations = useMemo(() => {
    return isOrganizationsDataSuccess && organizationsData?.length === 0 ? true : false
  }, [isOrganizationsDataSuccess, organizationsData])

  const alreadyInstalled = useMemo(() => {
    return selectedOrg && installed[selectedOrg.slug] && source === 'marketplace' && !dataLoading
      ? true
      : false
  }, [dataLoading, installed, selectedOrg, source])

  const missingParams = [
    !code ? 'code' : undefined,
    !configurationId ? 'configurationId' : undefined,
    !source ? 'source' : undefined,
  ].filter(Boolean) as string[]

  const isError = isOrganizationsError || isIntegrationsError
  const errorMessage = getErrorMessage(organizationsError) ?? getErrorMessage(integrationsError)
  const showLoadingState = isLoadingOrganizationsQuery || isLoadingIntegrationsQuery

  const disableInstallationForm =
    dataLoading ||
    // disables installation button if integration is already installed and it is Marketplace flow
    alreadyInstalled ||
    noOrganizations ||
    !selectedOrg ||
    missingParams.length > 0 ||
    isError
  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>

      <InterstitialLayout
        logo={<VercelIntegrationLogo />}
        title="Install Vercel Integration"
        description="Choose the Supabase organization Vercel can connect to"
        footer={<VercelIntegrationFooter />}
      >
        <div className="px-6 pb-6">
          {showLoadingState ? (
            <InstallationLoadingState />
          ) : isError ? (
            <VercelIntegrationInterstitialErrorState
              title="Unable to load installation"
              errorMessage={errorMessage}
            />
          ) : (
            <div className="flex flex-col gap-5">
              <InterstitialAccountRow avatarUrl={avatarUrl} displayName={displayName} />

              <OrganizationSelect
                organizations={organizationsData ?? []}
                selectedOrg={selectedOrg}
                disabled={noOrganizations || dataLoading}
                installed={installed}
                onSelectedOrgChange={setSelectedOrg}
              />

              {missingParams.length > 0 && (
                <Admonition
                  type="warning"
                  title="Missing Vercel installation details"
                  description={`Retry from Vercel. The installation URL is missing: ${missingParams.join(
                    ', '
                  )}.`}
                />
              )}

              {alreadyInstalled && (
                <Admonition
                  type="warning"
                  title="Vercel integration is already installed"
                  description="Choose another organization to install this marketplace integration."
                />
              )}

              {noOrganizations && (
                <Admonition
                  type="warning"
                  title="No Supabase organizations found"
                  description={
                    <>
                      Create a Supabase organization before installing the Vercel integration. You
                      can create a new organization{' '}
                      <Link href="https://supabase.com/dashboard/new" target="_blank">
                        here
                      </Link>
                      .
                    </>
                  }
                />
              )}

              <div className="flex flex-col gap-2">
                <Button
                  block
                  variant="primary"
                  disabled={disableInstallationForm}
                  loading={dataLoading}
                  onClick={onInstall}
                >
                  Install integration
                </Button>
              </div>
            </div>
          )}
        </div>
      </InterstitialLayout>
    </>
  )
}

const InstallationLoadingState = () => (
  <div className="flex flex-col gap-5">
    <Card className="shadow-none">
      <CardContent className="flex items-center gap-3 border-none px-4 py-3">
        <ShimmeringLoader className="size-8 flex-shrink-0 rounded-full py-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <ShimmeringLoader className="h-3 w-20 py-0" />
          <ShimmeringLoader className="h-4 w-40 max-w-full py-0" />
        </div>
      </CardContent>
    </Card>
    <section className="space-y-2" aria-label="Organization loading">
      <ShimmeringLoader className="h-3 w-24 py-0" />
      <ShimmeringLoader className="h-[34px] w-full rounded-md py-0" />
    </section>
    <ShimmeringLoader className="h-10 w-full rounded-md py-0" />
  </div>
)

interface OrganizationSelectProps {
  organizations: Organization[]
  selectedOrg: Organization | null
  disabled?: boolean
  installed: Record<string, boolean>
  onSelectedOrgChange: (organization: Organization) => void
}

function OrganizationSelect({
  organizations,
  selectedOrg,
  disabled,
  installed,
  onSelectedOrgChange,
}: OrganizationSelectProps) {
  return (
    <section className="space-y-2" aria-label="Organization">
      <p className="text-xs font-medium uppercase tracking-wider text-foreground-light">
        Organization
      </p>
      <Select
        value={selectedOrg?.slug ?? ''}
        disabled={disabled}
        onValueChange={(slug) => {
          const org = organizations.find((org) => org.slug === slug)
          if (org) onSelectedOrgChange(org)
        }}
      >
        <SelectTrigger size="small" aria-label="Supabase organization to install Vercel into">
          <SelectValue placeholder="Choose an organization" />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.slug} value={org.slug} className="text-xs">
              <div className="flex items-center gap-2">
                <span className="truncate">{org.name}</span>
                {installed[org.slug] && <Badge className="flex-none!">Installed</Badge>}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </section>
  )
}

export default withAuth(VercelIntegration)
