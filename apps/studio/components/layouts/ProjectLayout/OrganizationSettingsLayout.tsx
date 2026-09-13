import { useFlag, useParams } from 'common'
import { PropsWithChildren, useMemo } from 'react'

import { useIsPlatformWebhooksEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import type { SidebarSection } from '@/components/layouts/AccountLayout/AccountLayout.types'
import { toSubMenuSections } from '@/components/layouts/AccountLayout/AccountLayout.utils'
import { WithSidebar } from '@/components/layouts/AccountLayout/WithSidebar'
import { ProductMenuShortcuts } from '@/components/ui/ProductMenu/ProductMenuShortcuts'
import { convertSectionsToProductMenu } from '@/components/ui/ProductMenu/SubMenu.utils'
import { useCurrentPath } from '@/hooks/misc/useCurrentPath'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

interface OrganizationSettingsMenuItemsProps {
  slug?: string
  showSecuritySettings?: boolean
  showSsoSettings?: boolean
  showLegalDocuments?: boolean
  showPlatformWebhooks?: boolean
  showPrivateApps?: boolean
  showAuditLogDrains?: boolean
}

interface OrganizationSettingsSectionsProps extends OrganizationSettingsMenuItemsProps {
  currentPath: string
}

export const normalizeOrganizationSettingsPath = (path: string) => path.split('#')[0]

export const generateOrganizationSettingsMenuItems = ({
  slug,
  showSecuritySettings = true,
  showSsoSettings = true,
  showLegalDocuments = true,
  showPlatformWebhooks = true,
  showPrivateApps: _showPrivateApps = false,
  showAuditLogDrains = false,
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
  ...(showAuditLogDrains
    ? [
        {
          key: 'audit-log-drains',
          label: 'Audit Log Drains',
          href: `/org/${slug}/audit-log-drains`,
        },
      ]
    : []),
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
  showPrivateApps = false,
  showAuditLogDrains = false,
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
      shortcutId: SHORTCUT_IDS.NAV_ORG_SETTINGS_GENERAL,
    },
    ...(showSecuritySettings
      ? [
          {
            key: 'security',
            label: 'Security',
            href: `/org/${slug}/security`,
            shortcutId: SHORTCUT_IDS.NAV_ORG_SETTINGS_SECURITY,
          },
        ]
      : []),
    ...(showSsoSettings
      ? [
          {
            key: 'sso',
            label: 'SSO',
            href: `/org/${slug}/sso`,
            shortcutId: SHORTCUT_IDS.NAV_ORG_SETTINGS_SSO,
          },
        ]
      : []),
  ]

  const connectionsLinks = [
    {
      key: 'apps',
      label: 'OAuth Apps',
      href: `/org/${slug}/apps`,
      shortcutId: SHORTCUT_IDS.NAV_ORG_SETTINGS_APPS,
    },
    ...(showPrivateApps
      ? [
          {
            key: 'private-apps',
            label: 'Private Apps',
            href: `/org/${slug}/private-apps`,
            shortcutId: SHORTCUT_IDS.NAV_ORG_SETTINGS_PRIVATE_APPS,
          },
        ]
      : []),
    ...(showPlatformWebhooks
      ? [
          {
            key: 'webhooks',
            label: 'Webhooks',
            href: `/org/${slug}/webhooks`,
            shortcutId: SHORTCUT_IDS.NAV_ORG_SETTINGS_WEBHOOKS,
          },
        ]
      : []),
  ]

  const complianceLinks = [
    {
      key: 'audit',
      label: 'Audit Logs',
      href: `/org/${slug}/audit`,
      shortcutId: SHORTCUT_IDS.NAV_ORG_SETTINGS_AUDIT,
    },
    ...(showAuditLogDrains
      ? [
          {
            key: 'audit-log-drains',
            label: 'Audit Log Drains',
            href: `/org/${slug}/audit-log-drains`,
            shortcutId: SHORTCUT_IDS.NAV_ORG_SETTINGS_AUDIT_LOG_DRAINS,
          },
        ]
      : []),
    ...(showLegalDocuments
      ? [
          {
            key: 'documents',
            label: 'Legal Documents',
            href: `/org/${slug}/documents`,
            shortcutId: SHORTCUT_IDS.NAV_ORG_SETTINGS_DOCUMENTS,
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

export function OrganizationSettingsLayout({ children }: PropsWithChildren) {
  const { slug } = useParams()
  const showPlatformWebhooks = useIsPlatformWebhooksEnabled()
  const showPrivateApps = useFlag('privateApps')
  const showAuditLogDrains = useFlag('auditLogsLogDrain')
  const fullCurrentPath = useCurrentPath()
  const currentPath = normalizeOrganizationSettingsPath(fullCurrentPath)

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
    showPrivateApps,
    showAuditLogDrains,
  })

  const orgSettingsMenu = useMemo(
    () => convertSectionsToProductMenu(toSubMenuSections(sections)),
    [sections]
  )

  // Browser titles for org settings routes are set by OrganizationLayout.
  return (
    <>
      <ProductMenuShortcuts menu={orgSettingsMenu} />
      <WithSidebar
        title="Organization Settings"
        sections={sections}
        header={
          <div className="border-default flex min-h-(--header-height) items-center border-b px-6">
            <h4 className="text-lg">Settings</h4>
          </div>
        }
      >
        {children}
      </WithSidebar>
    </>
  )
}
