import { useLocation } from '@tanstack/react-router'
import { useFlag, useParams } from 'common'

import {
  generateOrganizationSettingsSections,
  normalizeOrganizationSettingsPath,
} from './OrganizationSettingsLayout'
import { useIsPlatformWebhooksEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { SubMenu } from '@/components/ui/ProductMenu/SubMenu'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export interface OrganizationSettingsMenuProps {
  onCloseSheet?: () => void
}

export function OrganizationSettingsMenu({ onCloseSheet }: OrganizationSettingsMenuProps) {
  const { pathname, orgSlug } = useLocation({
    select: (location) => ({
      pathname: location.pathname,
      orgSlug: (location.search as Record<string, string | string[] | undefined>).orgSlug,
    }),
  })
  const { slug } = useParams()
  const organizationSlug = slug ?? (typeof orgSlug === 'string' ? orgSlug : '')

  const currentPath = normalizeOrganizationSettingsPath(pathname)
  const showPlatformWebhooks = useIsPlatformWebhooksEnabled()
  const showPrivateApps = useFlag('privateApps')

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
    slug: organizationSlug,
    currentPath,
    showSecuritySettings: showSecuritySettings,
    showSsoSettings,
    showLegalDocuments,
    showPlatformWebhooks,
    showPrivateApps,
  })

  const page = currentPath.split('/').filter(Boolean).pop()

  return <SubMenu sections={sections} page={page} onItemClick={onCloseSheet} />
}
