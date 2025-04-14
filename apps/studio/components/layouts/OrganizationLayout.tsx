import { ExternalLink } from 'lucide-react'
import { useRouter } from 'next/router'
import { Fragment, type PropsWithChildren } from 'react'

import { useNewLayout } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import PartnerIcon from 'components/ui/PartnerIcon'
import { PARTNER_TO_NAME } from 'components/ui/PartnerManagedResource'
import { useVercelRedirectQuery } from 'data/integrations/vercel-redirect-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { withAuth } from 'hooks/misc/withAuth'
import { IS_PLATFORM } from 'lib/constants'
import { Alert_Shadcn_, AlertTitle_Shadcn_, Button, cn } from 'ui'
import { SidebarSection } from './AccountLayout/AccountLayout.types'
import WithSidebar from './AccountLayout/WithSidebar'
import LayoutHeader from './ProjectLayout/LayoutHeader/LayoutHeader'

const OrganizationLayoutContent = ({ children }: PropsWithChildren<{}>) => {
  const selectedOrganization = useSelectedOrganization()
  const { data, isSuccess } = useVercelRedirectQuery({
    installationId: selectedOrganization?.partner_id,
  })
  return (
    <div className={cn('w-full flex flex-col overflow-hidden')}>
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
      <main className="h-full w-full overflow-y-auto">{children}</main>
    </div>
  )
}

const OrganizationLayout = ({ children }: PropsWithChildren<{}>) => {
  const router = useRouter()
  const newLayoutPreview = useNewLayout()

  const selectedOrganization = useSelectedOrganization()
  const { data: organizations } = useOrganizationsQuery()

  const organizationsLinks = (organizations ?? [])
    .map((organization) => ({
      isActive:
        router.pathname.startsWith('/org/') && selectedOrganization?.slug === organization.slug,
      label: organization.name,
      href: `/org/${organization.slug}/general`,
      key: organization.slug,
      icon: <PartnerIcon organization={organization} />,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const sectionsWithHeaders: SidebarSection[] = [
    {
      heading: 'Projects',
      key: 'projects',
      links: [
        {
          isActive: router.pathname === '/projects',
          label: 'All projects',
          href: '/projects',
          key: 'all-projects-item',
        },
      ],
    },
    ...(IS_PLATFORM && organizationsLinks?.length > 0
      ? [
          {
            heading: 'Organizations',
            key: 'organizations',
            links: organizationsLinks,
          },
        ]
      : []),
    ...(IS_PLATFORM
      ? [
          {
            heading: 'Account',
            key: 'account',
            links: [
              {
                isActive: router.pathname === `/account/me`,
                label: 'Preferences',
                href: `/account/me`,
                key: `/account/me`,
              },
              {
                isActive: router.pathname === `/account/tokens`,
                label: 'Access Tokens',
                href: `/account/tokens`,
                key: `/account/tokens`,
              },

              {
                isActive: router.pathname === `/account/security`,
                label: 'Security',
                href: `/account/security`,
                key: `/account/security`,
              },
              {
                isActive: router.pathname === `/account/audit`,
                label: 'Audit Logs',
                href: `/account/audit`,
                key: `/account/audit`,
              },
            ],
          },
        ]
      : []),
    {
      heading: 'Documentation',
      key: 'documentation',
      links: [
        {
          key: 'ext-guides',
          label: 'Guides',
          href: 'https://supabase.com/docs',
          isExternal: true,
        },
        {
          key: 'ext-guides',
          label: 'API Reference',
          href: 'https://supabase.com/docs/guides/api',
          isExternal: true,
        },
      ],
    },
  ]

  const OrganizationLayoutContentWrapper = !newLayoutPreview ? WithSidebar : Fragment

  return (
    <OrganizationLayoutContentWrapper
      title={selectedOrganization?.name ?? 'Supabase'}
      breadcrumbs={[{ key: `org-settings`, label: 'Settings' }]}
      sections={sectionsWithHeaders}
    >
      {!newLayoutPreview && <LayoutHeader />}
      <OrganizationLayoutContent>{children}</OrganizationLayoutContent>
    </OrganizationLayoutContentWrapper>
  )
}

export default withAuth(OrganizationLayout)
