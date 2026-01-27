import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { ProjectLayout } from '../ProjectLayout'
import { generateSettingsMenu } from './SettingsMenu.utils'

interface SettingsLayoutProps {
  title?: string
}

const SettingsLayout = ({ title, children }: PropsWithChildren<SettingsLayoutProps>) => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  // billing pages live under /billing/invoices and /billing/subscription, etc
  // so we need to pass the [5]th part of the url to the menu
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
    logDrains: projectSettingsLogDrains,
    billing: billingAll,
  })

  return (
    <ProjectLayout
      isBlocking={false}
      title={title || 'Settings'}
      product="Settings"
      productMenu={<ProductMenu page={page} menu={menuRoutes} />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(SettingsLayout)
