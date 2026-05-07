import PartnerIcon from 'components/ui/PartnerIcon'
import { PARTNER_TO_NAME } from 'components/ui/PartnerManagedResource'
import { useAwsRedirectQuery } from 'data/integrations/aws-redirect-query'
import { useVercelRedirectQuery } from 'data/integrations/vercel-redirect-query'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { withAuth } from 'hooks/misc/withAuth'
import { MANAGED_BY } from 'lib/constants/infrastructure'
import { buildStudioPageTitle } from 'lib/page-title'
import { ExternalLink } from 'lucide-react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import type { PropsWithChildren } from 'react'
import { Alert_Shadcn_, AlertTitle_Shadcn_, Button, cn } from 'ui'

import { useRegisterOrgMenu } from './OrganizationLayout/useRegisterOrgMenu'

interface OrganizationLayoutProps {
  title: string
}

// [Joshen] Just for page title generation for org settings pages
const settingsPages = ['general', 'security', 'sso', 'apps', 'audit', 'documents']

const OrganizationLayoutContent = ({
  children,
  title,
}: PropsWithChildren<OrganizationLayoutProps>) => {
  const router = useRouter()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { appTitle } = useCustomContent(['app:title'])

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

  // Select the appropriate query based on partner
  const { data, isSuccess } =
    selectedOrganization?.managed_by === MANAGED_BY.AWS_MARKETPLACE ? awsQuery : vercelQuery

  return (
    <div className={cn('h-full w-full flex flex-col overflow-hidden')}>
      {pageTitle && (
        <Head>
          <title>{pageTitle}</title>
          <meta name="description" content="Supabase Studio" />
        </Head>
      )}
      {selectedOrganization && selectedOrganization?.managed_by !== 'supabase' && (
        <Alert_Shadcn_
          variant="default"
          className="flex items-center gap-4 border-t-0 border-x-0 rounded-none"
        >
          <PartnerIcon organization={selectedOrganization} showTooltip={false} size="medium" />
          <AlertTitle_Shadcn_ className="flex-1">
            This organization is managed by {PARTNER_TO_NAME[selectedOrganization.managed_by]}.
          </AlertTitle_Shadcn_>
          <Button asChild type="default" iconRight={<ExternalLink />} disabled={!isSuccess}>
            <a href={data?.url} target="_blank" rel="noopener noreferrer">
              Manage
            </a>
          </Button>
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
