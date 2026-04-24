import { LOCAL_STORAGE_KEYS } from 'common'
import { ExternalLink, XIcon } from 'lucide-react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import type { PropsWithChildren } from 'react'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, Button, cn } from 'ui'

import { useRegisterOrgMenu } from './OrganizationLayout/useRegisterOrgMenu'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import PartnerIcon from '@/components/ui/PartnerIcon'
import { PARTNER_TO_NAME } from '@/components/ui/PartnerManagedResource'
import { useAwsRedirectQuery } from '@/data/integrations/aws-redirect-query'
import { useVercelRedirectQuery } from '@/data/integrations/vercel-redirect-query'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { withAuth } from '@/hooks/misc/withAuth'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { buildStudioPageTitle } from '@/lib/page-title'

interface OrganizationLayoutProps {
  title: string
}

// [Joshen] Just for page title generation for org settings pages
const settingsPages = ['general', 'security', 'sso', 'apps', 'audit', 'documents']

type MarketplaceBannerRedirectSource = 'vercel' | 'aws'

type MarketplaceBannerConfig = {
  title: string
  description: string
  redirectSource?: MarketplaceBannerRedirectSource
}

const MARKETPLACE_BANNER_CONFIG: Record<
  | typeof MANAGED_BY.VERCEL_MARKETPLACE
  | typeof MANAGED_BY.AWS_MARKETPLACE
  | typeof MANAGED_BY.STRIPE_PROJECTS,
  MarketplaceBannerConfig
> = {
  [MANAGED_BY.VERCEL_MARKETPLACE]: {
    title: 'This organization is managed via Vercel Marketplace',
    description: 'Billing and some organization access settings are managed in Vercel.',
    redirectSource: 'vercel',
  },
  [MANAGED_BY.AWS_MARKETPLACE]: {
    title: 'This organization is billed via AWS Marketplace',
    description: 'Changes to billing and payment details must be made in AWS.',
    redirectSource: 'aws',
  },
  [MANAGED_BY.STRIPE_PROJECTS]: {
    title: 'This organization is connected to Stripe',
    description: 'Changes here will be reflected in your connected Stripe account.',
  },
}

const DEFAULT_ORGANIZATION_MARKETPLACE_BANNER_DISMISS_KEY =
  LOCAL_STORAGE_KEYS.ORGANIZATION_MARKETPLACE_BANNER_DISMISSED('unknown', MANAGED_BY.SUPABASE)

function getMarketplaceBannerDismissKey({
  organizationSlug,
  managedBy,
}: {
  organizationSlug?: string
  managedBy?: string
}) {
  if (!organizationSlug || !managedBy) return DEFAULT_ORGANIZATION_MARKETPLACE_BANNER_DISMISS_KEY

  return LOCAL_STORAGE_KEYS.ORGANIZATION_MARKETPLACE_BANNER_DISMISSED(organizationSlug, managedBy)
}

function getMarketplaceBannerConfig(managedBy?: string): MarketplaceBannerConfig | undefined {
  switch (managedBy) {
    case MANAGED_BY.VERCEL_MARKETPLACE:
      return MARKETPLACE_BANNER_CONFIG[MANAGED_BY.VERCEL_MARKETPLACE]
    case MANAGED_BY.AWS_MARKETPLACE:
      return MARKETPLACE_BANNER_CONFIG[MANAGED_BY.AWS_MARKETPLACE]
    case MANAGED_BY.STRIPE_PROJECTS:
      return MARKETPLACE_BANNER_CONFIG[MANAGED_BY.STRIPE_PROJECTS]
    default:
      return undefined
  }
}

const OrganizationLayoutContent = ({
  children,
  title,
}: PropsWithChildren<OrganizationLayoutProps>) => {
  const router = useRouter()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { appTitle } = useCustomContent(['app:title'])
  const [isBannerDismissed, setIsBannerDismissed] = useLocalStorageQuery<boolean>(
    getMarketplaceBannerDismissKey({
      organizationSlug: selectedOrganization?.slug,
      managedBy: selectedOrganization?.managed_by,
    }),
    false
  )

  // Keep title intent close to each page (getLayout) to avoid route-to-title drift in this layout.
  const isSettingsSurface = settingsPages.some((x) => router.pathname.endsWith(x))
  const pageTitle = buildStudioPageTitle({
    section: title,
    surface: isSettingsSurface ? 'Organization Settings' : undefined,
    org: selectedOrganization?.name,
    brand: appTitle || 'Supabase',
  })

  const vercelQuery = useVercelRedirectQuery(
    { installationId: selectedOrganization?.partner_id },
    { enabled: selectedOrganization?.managed_by === MANAGED_BY.VERCEL_MARKETPLACE }
  )

  const awsQuery = useAwsRedirectQuery(
    { organizationSlug: selectedOrganization?.slug },
    { enabled: selectedOrganization?.managed_by === MANAGED_BY.AWS_MARKETPLACE }
  )

  const bannerConfig = getMarketplaceBannerConfig(selectedOrganization?.managed_by)

  const selectedRedirectQuery = (() => {
    if (!bannerConfig?.redirectSource) return undefined

    switch (bannerConfig.redirectSource) {
      case 'aws':
        return awsQuery
      case 'vercel':
        return vercelQuery
      default:
        return undefined
    }
  })()

  return (
    <div className={cn('h-full w-full flex flex-col overflow-hidden')}>
      {pageTitle && (
        <Head>
          <title>{pageTitle}</title>
          <meta name="description" content="Supabase Studio" />
        </Head>
      )}
      {selectedOrganization && bannerConfig && !isBannerDismissed && (
        <Alert_Shadcn_
          variant="default"
          className="flex items-center gap-4 border-t-0 border-x-0 rounded-none"
        >
          <PartnerIcon organization={selectedOrganization} showTooltip={false} size="medium" />
          <div className="flex-1">
            <AlertTitle_Shadcn_>{bannerConfig.title}</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>{bannerConfig.description}</AlertDescription_Shadcn_>
          </div>
          <div className="flex items-center gap-2">
            {selectedRedirectQuery?.data?.url && (
              <Button asChild type="default" iconRight={<ExternalLink />}>
                <a href={selectedRedirectQuery.data.url} target="_blank" rel="noopener noreferrer">
                  Manage
                </a>
              </Button>
            )}
            <ButtonTooltip
              type="text"
              icon={<XIcon size={14} />}
              className="h-7 w-7 p-0"
              onClick={() => setIsBannerDismissed(true)}
              aria-label="Dismiss banner"
              tooltip={{ content: { text: 'Dismiss' } }}
            />
          </div>
        </Alert_Shadcn_>
      )}
      <main className="h-full w-full overflow-y-auto flex flex-col">{children}</main>
    </div>
  )
}

const OrganizationLayout = ({ children, title }: PropsWithChildren<OrganizationLayoutProps>) => {
  useRegisterOrgMenu()
  return <OrganizationLayoutContent title={title}>{children}</OrganizationLayoutContent>
}

export default withAuth(OrganizationLayout)
