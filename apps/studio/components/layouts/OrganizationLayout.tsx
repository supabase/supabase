import { ExternalLink } from 'lucide-react'
import { useRouter } from 'next/router'
import type { PropsWithChildren } from 'react'

import PartnerIcon from 'components/ui/PartnerIcon'
import { PARTNER_TO_NAME } from 'components/ui/PartnerManagedResource'
import { useVercelRedirectQuery } from 'data/integrations/vercel-redirect-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useNewLayout } from 'hooks/ui/useNewLayout'
import { IS_PLATFORM } from 'lib/constants'
import { Alert_Shadcn_, AlertTitle_Shadcn_, Button, cn } from 'ui'
import { SidebarSection } from './AccountLayout/AccountLayout.types'
import WithSidebar from './AccountLayout/WithSidebar'
import LayoutHeader from './ProjectLayout/LayoutHeader/LayoutHeader'
import { ScaffoldContainer } from './Scaffold'

const OrganizationLayout = ({ children }: PropsWithChildren<{}>) => {
  const newLayoutPreview = useNewLayout()

  const selectedOrganization = useSelectedOrganization()
  const { data: organizations } = useOrganizationsQuery()

  const router = useRouter()

  const { data, isSuccess } = useVercelRedirectQuery({
    installationId: selectedOrganization?.partner_id,
  })

  const Content = () => (
    // <div className="flex flex-row h-full w-full">
    <div className={cn('w-full flex flex-col overflow-hidden')}>
      {/* <OrganizationResourceBanner /> */}
      {selectedOrganization && selectedOrganization?.managed_by !== 'supabase' && (
        <Alert_Shadcn_ variant="default" className="flex items-center gap-4">
          <PartnerIcon organization={selectedOrganization} showTooltip={false} size="medium" />
          <AlertTitle_Shadcn_ className="flex-1">
            This organization is managed by {PARTNER_TO_NAME[selectedOrganization.managed_by]}.
          </AlertTitle_Shadcn_>
          <Button type="default" iconRight={<ExternalLink />} asChild disabled={!isSuccess}>
            <a href={data?.url} target="_blank" rel="noopener noreferrer">
              Manage
            </a>
          </Button>
        </Alert_Shadcn_>
      )}
      <main className="h-full w-full overflow-y-auto">{children}</main>
    </div>
    // </div>
  )

  if (!newLayoutPreview) {
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

    return (
      <WithSidebar
        title={selectedOrganization?.name ?? 'Supabase'}
        breadcrumbs={[{ key: `org-settings`, label: 'Settings' }]}
        sections={sectionsWithHeaders}
      >
        {!newLayoutPreview && <LayoutHeader />}
        <Content />
      </WithSidebar>
    )
  } else {
    return <Content />
  }
}

export default OrganizationLayout
