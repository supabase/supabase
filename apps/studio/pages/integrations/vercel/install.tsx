import { useParams } from 'common'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import InlineSVG from 'react-inlinesvg'
import { toast } from 'sonner'
import { Button, Card, CardContent } from 'ui'
import { Admonition, ShimmeringLoader } from 'ui-patterns'

import {
  ConnectMockMenu,
  ConnectPreviewToolbar,
  getConnectMockState,
  isTemporaryConnectMockPreviewEnabled,
} from '@/components/interfaces/Connect/ConnectMockMenu'
import { ConnectOrganizationSelector } from '@/components/interfaces/Connect/ConnectOrganizationSelector'
import { getHasInstalledObject } from '@/components/layouts/IntegrationsLayout/Integrations.utils'
import {
  InterstitialAccountRow,
  InterstitialLayout,
  LogoBox,
  LogoPair,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { useIntegrationsQuery } from '@/data/integrations/integrations-query'
import { useVercelIntegrationCreateMutation } from '@/data/integrations/vercel-integration-create-mutation'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { withAuth } from '@/hooks/misc/withAuth'
import { BASE_PATH } from '@/lib/constants'
import { buildStudioPageTitle } from '@/lib/page-title'
import { useProfile } from '@/lib/profile'
import { useIntegrationInstallationSnapshot } from '@/state/integration-installation'
import type { NextPageWithLayout, Organization } from '@/types'

/**
 * Variations of the Vercel integration flow.
 * They require different UI and logic.
 *
 * Deploy Button - the flow that starts from the Deploy Button - https://vercel.com/docs/integrations#deploy-button
 * Marketplace - the flow that starts from the Marketplace - https://vercel.com/integrations
 *
 */
export type VercelIntegrationFlow = 'deploy-button' | 'marketing'

export const VERCEL_INSTALL_MOCK_STATES = [
  'loading',
  'ready',
  'installing',
  'installed',
  'already-installed',
  'no-organizations',
  'missing-params',
  'error',
] as const

export type VercelInstallMockState = (typeof VERCEL_INSTALL_MOCK_STATES)[number]

const PAGE_TITLE = buildStudioPageTitle({ section: 'Install Vercel', brand: 'Supabase' })
const MOCK_SELECTED_ORG_SLUG = 'acme-production'
const SUPPORTED_INSTALL_SOURCES = ['deploy-button', 'marketplace', 'external'] as const

const createMockOrganization = (details: Partial<Organization>): Organization => ({
  id: 1,
  name: 'Acme Production',
  slug: MOCK_SELECTED_ORG_SLUG,
  plan: { id: 'pro', name: 'Pro' },
  managed_by: 'supabase',
  is_owner: true,
  billing_email: 'billing@example.com',
  billing_partner: null,
  integration_source: null,
  usage_billing_enabled: true,
  stripe_customer_id: 'cus_mock',
  subscription_id: 'sub_mock',
  organization_requires_mfa: false,
  opt_in_tags: [],
  restriction_status: null,
  restriction_data: null,
  organization_missing_address: false,
  organization_missing_tax_id: false,
  ...details,
})

const MOCK_ORGANIZATIONS = [
  createMockOrganization({ id: 1, name: 'Acme Production', slug: MOCK_SELECTED_ORG_SLUG }),
  createMockOrganization({ id: 2, name: 'Personal Sandbox', slug: 'personal-sandbox' }),
  createMockOrganization({ id: 3, name: 'Loosey Goosey', slug: 'already-connected' }),
]
const EMPTY_ORGANIZATIONS: Organization[] = []

const VercelLogo = () => (
  <LogoBox className="border-black dark:border-muted bg-black text-white">
    <InlineSVG
      src={`${BASE_PATH}/img/icons/vercel-icon.svg`}
      title="Vercel"
      className="size-6 text-white"
    />
  </LogoBox>
)

const VercelInstallInterstitial = ({
  description,
  children,
}: {
  description?: ReactNode
  children: ReactNode
}) => (
  <InterstitialLayout
    logo={<LogoPair left={<VercelLogo />} right={<SupabaseLogo />} />}
    title="Install Vercel"
    description={description ?? 'Choose an organization to connect to Vercel'}
  >
    <div className="px-6 pb-6">{children}</div>
  </InterstitialLayout>
)

const getStringParam = (value: unknown) => (typeof value === 'string' ? value : undefined)

const isSupportedInstallSource = (source?: string) =>
  source !== undefined &&
  SUPPORTED_INSTALL_SOURCES.includes(source as (typeof SUPPORTED_INSTALL_SOURCES)[number])

const getMissingParameters = ({
  code,
  configurationId,
  source,
}: {
  code?: string
  configurationId?: string
  source?: string
}) =>
  [
    !code ? 'code' : undefined,
    !configurationId ? 'configurationId' : undefined,
    !source ? 'source' : undefined,
  ].filter(Boolean) as string[]

const VercelIntegration: NextPageWithLayout = () => {
  const router = useRouter()
  const params = useParams()
  const code = getStringParam(params.code)
  const configurationId = getStringParam(params.configurationId)
  const teamId = getStringParam(params.teamId)
  const source = getStringParam(params.source)
  const snapshot = useIntegrationInstallationSnapshot()
  const { profile } = useProfile()
  const [selectedOrgSlug, setSelectedOrgSlug] = useState<string | null>(null)

  const mock =
    router.isReady && isTemporaryConnectMockPreviewEnabled()
      ? getConnectMockState(router.query.mock, VERCEL_INSTALL_MOCK_STATES)
      : undefined
  const isMockMode = !!mock

  const {
    data: integrationData,
    isLoading: isLoadingIntegrations,
    isError: isIntegrationsError,
    error: integrationsError,
  } = useIntegrationsQuery({ enabled: !isMockMode })

  const {
    data: organizationsData,
    isPending: isLoadingOrganizations,
    isError: isOrganizationsError,
    error: organizationsError,
  } = useOrganizationsQuery({ enabled: !isMockMode })

  const effectiveOrganizations = useMemo(() => {
    if (isMockMode) {
      return mock === 'no-organizations' ? EMPTY_ORGANIZATIONS : MOCK_ORGANIZATIONS
    }

    return organizationsData ?? EMPTY_ORGANIZATIONS
  }, [isMockMode, mock, organizationsData])
  const effectiveSource = isMockMode && mock !== 'missing-params' ? 'marketplace' : source
  const effectiveCode = isMockMode && mock !== 'missing-params' ? 'mock-code' : code
  const effectiveConfigurationId =
    isMockMode && mock !== 'missing-params' ? 'mock-configuration-id' : configurationId
  const effectiveInstalledByOrgSlug = useMemo(() => {
    if (isMockMode) {
      return mock === 'already-installed' ? { [MOCK_SELECTED_ORG_SLUG]: true } : {}
    }

    if (!integrationData || !organizationsData) return {}

    return getHasInstalledObject({
      integrationName: 'Vercel',
      integrationData,
      organizationsData,
      installationId: configurationId,
    })
  }, [configurationId, integrationData, isMockMode, mock, organizationsData])

  const missingParameters = getMissingParameters({
    code: effectiveCode,
    configurationId: effectiveConfigurationId,
    source: effectiveSource,
  })
  const unsupportedSource =
    effectiveSource !== undefined && !isSupportedInstallSource(effectiveSource)
  const isLoading =
    mock === 'loading' || (!isMockMode && (isLoadingIntegrations || isLoadingOrganizations))
  const isError = mock === 'error' || isIntegrationsError || isOrganizationsError
  const errorMessage = integrationsError?.message ?? organizationsError?.message
  const isInstalling = mock === 'installing'

  const selectableOrganizations = useMemo(
    () =>
      effectiveOrganizations.filter(
        (organization) =>
          !(effectiveSource === 'marketplace' && effectiveInstalledByOrgSlug[organization.slug])
      ),
    [effectiveInstalledByOrgSlug, effectiveOrganizations, effectiveSource]
  )

  useEffect(() => {
    if (isLoading) return
    if (selectedOrgSlug && selectableOrganizations.some(({ slug }) => slug === selectedOrgSlug)) {
      return
    }

    setSelectedOrgSlug(selectableOrganizations[0]?.slug ?? null)
  }, [isLoading, selectableOrganizations, selectedOrgSlug])

  const selectedOrganization = effectiveOrganizations.find(({ slug }) => slug === selectedOrgSlug)

  const replaceMockState = (state: VercelInstallMockState) => {
    router.replace(
      { pathname: router.pathname, query: { ...router.query, mock: state } },
      undefined,
      { shallow: true }
    )
  }

  function handleRouteChange(orgSlug: string) {
    switch (effectiveSource) {
      case 'deploy-button': {
        router.push({
          pathname: `/integrations/vercel/${orgSlug}/deploy-button/new-project`,
          query: router.query,
        })
        break
      }
      case 'marketplace':
      case 'external': {
        router.push({
          pathname: `/integrations/vercel/${orgSlug}/marketplace/choose-project`,
          query: router.query,
        })
        break
      }
      default:
        toast.error(
          `Unsupported Vercel installation source: ${effectiveSource}. Please contact support if this error persists.`
        )
    }
  }

  const { mutate, isPending: isLoadingVercelIntegrationCreateMutation } =
    useVercelIntegrationCreateMutation({
      onMutate() {
        snapshot.setLoading(true)
      },
      onSuccess(_, variables) {
        handleRouteChange(variables.orgSlug)
        snapshot.setLoading(false)
      },
      onError(error) {
        snapshot.setLoading(false)
        toast.error(`Creating Vercel integration failed: ${error.message}`)
      },
    })

  function onInstall() {
    const orgSlug = selectedOrganization?.slug
    const isIntegrationInstalled = orgSlug ? effectiveInstalledByOrgSlug[orgSlug] : false

    if (!orgSlug) {
      return toast.error('Please select an organization')
    }

    if (!effectiveCode) {
      return toast.error('Vercel code missing')
    }

    if (!effectiveConfigurationId) {
      return toast.error('Vercel Configuration ID missing')
    }

    if (!effectiveSource) {
      return toast.error('Vercel Configuration source missing')
    }

    if (isMockMode) return

    if (!isIntegrationInstalled) {
      mutate({
        code: effectiveCode,
        configurationId: effectiveConfigurationId,
        orgSlug,
        metadata: {},
        source: effectiveSource,
        teamId,
      })
    } else {
      handleRouteChange(orgSlug)
    }
  }

  if (!router.isReady) return null

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>
      {mock && (
        <ConnectPreviewToolbar>
          <ConnectMockMenu
            state={mock}
            states={VERCEL_INSTALL_MOCK_STATES}
            onSelect={replaceMockState}
          />
        </ConnectPreviewToolbar>
      )}
      <VercelInstallScreen
        organizations={effectiveOrganizations}
        installedByOrgSlug={effectiveInstalledByOrgSlug}
        selectedOrgSlug={selectedOrgSlug}
        source={effectiveSource}
        displayName={profile?.primary_email ?? profile?.username}
        isLoading={isLoading}
        isInstalling={isInstalling || isLoadingVercelIntegrationCreateMutation}
        isInstalled={mock === 'installed'}
        isError={isError}
        errorMessage={errorMessage}
        missingParameters={missingParameters}
        unsupportedSource={unsupportedSource ? effectiveSource : undefined}
        onSelectOrg={setSelectedOrgSlug}
        onInstall={onInstall}
        onCreateOrganization={() => {
          if (isMockMode) return
          router.push('/new')
        }}
      />
    </>
  )
}

export const VercelInstallScreen = ({
  organizations,
  installedByOrgSlug,
  selectedOrgSlug,
  source,
  displayName,
  isLoading = false,
  isInstalling = false,
  isInstalled = false,
  isError = false,
  errorMessage,
  missingParameters = [],
  unsupportedSource,
  onSelectOrg,
  onInstall,
  onCreateOrganization,
}: {
  organizations: Organization[]
  installedByOrgSlug: Record<string, boolean>
  selectedOrgSlug: string | null
  source?: string
  displayName?: string
  isLoading?: boolean
  isInstalling?: boolean
  isInstalled?: boolean
  isError?: boolean
  errorMessage?: string
  missingParameters?: string[]
  unsupportedSource?: string
  onSelectOrg: (slug: string) => void
  onInstall: () => void
  onCreateOrganization?: () => void
}) => {
  const unavailableOrganizations = organizations.filter(
    (organization) => source === 'marketplace' && installedByOrgSlug[organization.slug]
  )
  const linkableOrganizations = organizations.filter(
    (organization) => !(source === 'marketplace' && installedByOrgSlug[organization.slug])
  )
  const selectedOrganization = organizations.find(({ slug }) => slug === selectedOrgSlug)
  const selectedOrgAlreadyInstalled = selectedOrgSlug ? installedByOrgSlug[selectedOrgSlug] : false
  const hasOrganizations = organizations.length > 0
  const hasLinkableOrganizations = linkableOrganizations.length > 0
  const hasMissingParameters = missingParameters.length > 0
  const primaryLabel = !hasOrganizations
    ? 'Create organization'
    : selectedOrgAlreadyInstalled
      ? 'Continue'
      : 'Install integration'
  const primaryDisabled =
    isLoading ||
    isInstalling ||
    hasMissingParameters ||
    !!unsupportedSource ||
    (hasOrganizations && (!selectedOrgSlug || !hasLinkableOrganizations))

  if (isLoading) {
    return (
      <VercelInstallInterstitial
        description={<ShimmeringLoader className="mx-auto h-4 w-56 max-w-full py-0" />}
      >
        <ConnectLoadingCards />
      </VercelInstallInterstitial>
    )
  }

  if (hasMissingParameters || unsupportedSource) {
    return (
      <VercelInstallInterstitial>
        <div className="flex flex-col gap-3">
          <Admonition
            type="warning"
            title={unsupportedSource ? 'Unsupported install source' : 'Missing install parameters'}
            description={
              unsupportedSource
                ? `This Vercel install request uses an unsupported source: ${unsupportedSource}.`
                : `Open the install flow from Vercel again. The URL is missing parameter${
                    missingParameters.length === 1 ? '' : 's'
                  }: ${missingParameters.join(', ')}.`
            }
          />
          <Button type="default" block asChild>
            <Link href="/organizations">Back to dashboard</Link>
          </Button>
        </div>
      </VercelInstallInterstitial>
    )
  }

  if (isError) {
    return (
      <VercelInstallInterstitial>
        <div className="flex flex-col gap-3">
          <Admonition
            type="warning"
            title="Unable to load Vercel install"
            description={
              <>
                Please try again from Vercel.
                {errorMessage && (
                  <span className="mt-1 block text-foreground-lighter">Error: {errorMessage}</span>
                )}
              </>
            }
          />
          <Button type="default" block asChild>
            <Link href="/organizations">Back to dashboard</Link>
          </Button>
        </div>
      </VercelInstallInterstitial>
    )
  }

  if (isInstalled) {
    return (
      <VercelInstallInterstitial>
        <div className="flex flex-col gap-3">
          <Admonition
            type="success"
            title="Vercel installed"
            description="Continue in Vercel to choose the project you want to connect."
          />
          <Button type="primary" block onClick={onInstall}>
            Continue
          </Button>
        </div>
      </VercelInstallInterstitial>
    )
  }

  return (
    <VercelInstallInterstitial>
      <div className="flex flex-col gap-5">
        <InterstitialAccountRow displayName={displayName} />

        <ConnectOrganizationSelector
          organizations={linkableOrganizations}
          unavailableOrganizations={unavailableOrganizations}
          unavailableReason="These organizations already have Vercel installed."
          getUnavailableOrganizationDescription={() => 'Already installed'}
          selectedSlug={selectedOrgSlug}
          disabled={isInstalling}
          onSelect={onSelectOrg}
          createLabel={!hasOrganizations ? 'Create new organization' : undefined}
          onCreate={!hasOrganizations ? onCreateOrganization : undefined}
        />

        {!hasOrganizations && (
          <Admonition
            type="warning"
            description="Create a Supabase organization before installing Vercel."
          />
        )}

        {hasOrganizations && !hasLinkableOrganizations && (
          <Admonition
            type="warning"
            description="Vercel is already installed for your organizations."
          />
        )}

        <div className="flex flex-col gap-2">
          <Button
            type="primary"
            block
            loading={isInstalling}
            disabled={primaryDisabled}
            onClick={!hasOrganizations ? onCreateOrganization : onInstall}
          >
            {primaryLabel}
          </Button>
        </div>

        <div className="flex flex-col items-center gap-1 text-center text-xs text-foreground-lighter text-balance">
          {selectedOrganization && (
            <p>You can remove this integration at any time from Vercel or Supabase.</p>
          )}
        </div>
      </div>
    </VercelInstallInterstitial>
  )
}

const ConnectLoadingCards = () => (
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
    <section className="space-y-2" aria-label="Organizations">
      <ShimmeringLoader className="h-3 w-24 py-0" />
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="shadow-none">
          <CardContent className="flex items-center gap-3 border-none px-4 py-3">
            <ShimmeringLoader className="size-9 flex-shrink-0 rounded-lg py-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <ShimmeringLoader className="h-4 w-32 py-0" />
              <ShimmeringLoader className="h-3 w-20 py-0" />
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
    <div className="flex flex-col gap-2">
      <ShimmeringLoader className="h-10 w-full py-0" />
      <ShimmeringLoader className="h-10 w-full py-0" />
    </div>
  </div>
)

export default withAuth(VercelIntegration)
