import Head from 'next/head'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { useIsPlatformWebhooksEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import type { SidebarSection } from 'components/layouts/AccountLayout/AccountLayout.types'
import { WithSidebar } from 'components/layouts/AccountLayout/WithSidebar'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { useCurrentPath } from 'hooks/misc/useCurrentPath'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'

interface OrganizationSettingsMenuItemsProps {
  slug?: string
  showSecuritySettings?: boolean
  showSsoSettings?: boolean
  showLegalDocuments?: boolean
  showPlatformWebhooks?: boolean
}

interface OrganizationSettingsSectionsProps extends OrganizationSettingsMenuItemsProps {
  currentPath: string
}

interface OrganizationSettingsLayoutProps {
  pageTitle?: string
}

export const normalizeOrganizationSettingsPath = (path: string) => path.split('#')[0]
export const getOrganizationSettingsPageTitle = (pageTitle?: string) => pageTitle ?? 'Settings'
export const getOrganizationSettingsDocumentTitle = (
  pageTitle: string | undefined,
  title: string
) => `${getOrganizationSettingsPageTitle(pageTitle)} | ${title}`

export const generateOrganizationSettingsMenuItems = ({
  slug,
  showSecuritySettings = true,
  showSsoSettings = true,
  showLegalDocuments = true,
  showPlatformWebhooks = true,
}: OrganizationSettingsMenuItemsProps) => [
  {
    key: 'general',
    label: 'General',
    href: `/org/${slug}/general`,
  },
  ...(showSecuritySettings
    ? [
        {
          key: 'security',
          label: 'Security',
          href: `/org/${slug}/security`,
        },
      ]
    : []),
  {
    key: 'apps',
    label: 'OAuth Apps',
    href: `/org/${slug}/apps`,
  },
  ...(showSsoSettings
    ? [
        {
          key: 'sso',
          label: 'SSO',
          href: `/org/${slug}/sso`,
        },
      ]
    : []),
  ...(showPlatformWebhooks
    ? [
        {
          key: 'webhooks',
          label: 'Webhooks',
          href: `/org/${slug}/webhooks`,
        },
      ]
    : []),
  {
    key: 'audit',
    label: 'Audit Logs',
    href: `/org/${slug}/audit`,
  },
  ...(showLegalDocuments
    ? [
        {
          key: 'documents',
          label: 'Legal Documents',
          href: `/org/${slug}/documents`,
        },
      ]
    : []),
]

export const generateOrganizationSettingsSections = ({
  currentPath,
  slug,
  showSecuritySettings = true,
  showSsoSettings = true,
  showLegalDocuments = true,
  showPlatformWebhooks = true,
}: OrganizationSettingsSectionsProps): SidebarSection[] => {
  const isLinkActive = (key: string, href: string) =>
    key === 'webhooks'
      ? currentPath === href || currentPath.startsWith(`${href}/`)
      : currentPath === href

  const configurationLinks = [
    {
      key: 'general',
      label: 'General',
      href: `/org/${slug}/general`,
    },
    ...(showSecuritySettings
      ? [
          {
            key: 'security',
            label: 'Security',
            href: `/org/${slug}/security`,
          },
        ]
      : []),
    ...(showSsoSettings
      ? [
          {
            key: 'sso',
            label: 'SSO',
            href: `/org/${slug}/sso`,
          },
        ]
      : []),
  ]

  const connectionsLinks = [
    {
      key: 'apps',
      label: 'OAuth Apps',
      href: `/org/${slug}/apps`,
    },
    ...(showPlatformWebhooks
      ? [
          {
            key: 'webhooks',
            label: 'Webhooks',
            href: `/org/${slug}/webhooks`,
          },
        ]
      : []),
  ]

  const complianceLinks = [
    {
      key: 'audit',
      label: 'Audit Logs',
      href: `/org/${slug}/audit`,
    },
    ...(showLegalDocuments
      ? [
          {
            key: 'documents',
            label: 'Legal Documents',
            href: `/org/${slug}/documents`,
          },
        ]
      : []),
  ]

  return [
    {
      key: 'configuration',
      heading: 'Configuration',
      links: configurationLinks.map((item) => ({
        ...item,
        isActive: isLinkActive(item.key, item.href),
      })),
    },
    {
      key: 'connections',
      heading: 'Connections',
      links: connectionsLinks.map((item) => ({
        ...item,
        isActive: isLinkActive(item.key, item.href),
      })),
    },
    {
      key: 'compliance',
      heading: 'Compliance',
      links: complianceLinks.map((item) => ({
        ...item,
        isActive: isLinkActive(item.key, item.href),
      })),
    },
  ]
}

function OrganizationSettingsLayout({
  children,
  pageTitle,
}: PropsWithChildren<OrganizationSettingsLayoutProps>) {
  const { slug } = useParams()
  const showPlatformWebhooks = useIsPlatformWebhooksEnabled()
  const fullCurrentPath = useCurrentPath()
  const currentPath = normalizeOrganizationSettingsPath(fullCurrentPath)
  const { appTitle } = useCustomContent(['app:title'])
  const titleSuffix = appTitle || 'Supabase'

  const {
    organizationShowSsoSettings: showSsoSettings,
    organizationShowSecuritySettings: showSecuritySettings,
    organizationShowLegalDocuments: showLegalDocuments,
  } = useIsFeatureEnabled([
    'organization:show_sso_settings',
    'organization:show_security_settings',
    'organization:show_legal_documents',
  ])

  const sections = generateOrganizationSettingsSections({
    currentPath,
    slug,
    showSecuritySettings,
    showSsoSettings,
    showLegalDocuments,
    showPlatformWebhooks,
  })

  return (
    <>
      <Head>
        <title>{getOrganizationSettingsDocumentTitle(pageTitle, titleSuffix)}</title>
        <meta name="description" content="Supabase Studio" />
      </Head>
      <WithSidebar
        title="Organization Settings"
        breadcrumbs={[]}
        sections={sections}
        header={
          <div className="border-default flex min-h-[var(--header-height)] items-center border-b px-6">
            <h4 className="text-lg">Settings</h4>
          </div>
        }
      >
        {children}
      </WithSidebar>
    </>
  )
}

export default OrganizationSettingsLayout
