import { useFlag, useParams } from 'common'
import { useRouter } from 'next/router'

import {
  generateOrganizationSettingsSections,
  normalizeOrganizationSettingsPath,
} from './OrganizationSettingsLayout'
import { useIsPlatformWebhooksEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { SubMenu } from '@/components/ui/ProductMenu/SubMenu'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { getPathnameWithoutQuery } from '@/lib/pathname.utils'

export interface OrganizationSettingsMenuProps {
  onCloseSheet?: () => void
}

export function OrganizationSettingsMenu({ onCloseSheet }: OrganizationSettingsMenuProps) {
  const router = useRouter()
  const { slug } = useParams()
  const organizationSlug = slug ?? (router.query.orgSlug as string) ?? ''

  const pathname = getPathnameWithoutQuery(router.asPath, router.pathname)
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
