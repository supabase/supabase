import { useParams } from 'common'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { useRouter } from 'next/router'
import type { PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { generateSettingsMenu } from './SettingsMenu.utils'

/**
 * Menu-only component for the settings section. Used by the desktop sidebar and by the
 * mobile sheet submenu. Must not wrap ProjectLayout so that opening the settings submenu
 * in the mobile sheet does not overwrite registerOpenMenu and break the menu button.
 */
export const SettingsProductMenu = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  const page = router.pathname.includes('billing')
    ? router.pathname.split('/')[5]
    : router.pathname.split('/')[4]

  const {
    projectAuthAll: authEnabled,
    authenticationShowProviders: authProvidersEnabled,
    projectEdgeFunctionAll: edgeFunctionsEnabled,
    projectStorageAll: storageEnabled,
    billingInvoices: invoicesEnabled,
    projectSettingsLegacyJwtKeys: legacyJWTKeysEnabled,
    projectSettingsLogDrains,
    billingAll,
  } = useIsFeatureEnabled([
    'project_auth:all',
    'authentication:show_providers',
    'project_edge_function:all',
    'project_storage:all',
    'billing:invoices',
    'project_settings:legacy_jwt_keys',
    'project_settings:log_drains',
    'billing:all',
  ])

  const menuRoutes = generateSettingsMenu(ref, project, organization, {
    auth: authEnabled,
    authProviders: authProvidersEnabled,
    edgeFunctions: edgeFunctionsEnabled,
    storage: storageEnabled,
    invoices: invoicesEnabled,
    legacyJwtKeys: legacyJWTKeysEnabled,
    logDrains: projectSettingsLogDrains,
    billing: billingAll,
  })

  return <ProductMenu page={page} menu={menuRoutes} />
}

interface SettingsLayoutProps {
  title?: string
}

export const SettingsLayout = ({ title, children }: PropsWithChildren<SettingsLayoutProps>) => {
  return (
    <ProjectLayout
      isBlocking={false}
      title={title || 'Settings'}
      product="Settings"
      productMenu={<SettingsProductMenu />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(SettingsLayout)
