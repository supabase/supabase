import {
  useFlag,
  useIsFeatureEnabled,
  useSelectedOrganization,
  useSelectedProject,
  useStore,
  withAuth,
} from 'hooks'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'
import { generateSettingsMenu } from './SettingsMenu.utils'

import ProductMenu from 'components/ui/ProductMenu'
import ProjectLayout from '..'
import { useParams } from 'common'

interface SettingsLayoutProps {
  title?: string
}

const SettingsLayout = ({ title, children }: PropsWithChildren<SettingsLayoutProps>) => {
  const router = useRouter()
  const { ref } = useParams()
  const { ui, meta } = useStore()
  const project = useSelectedProject()
  const organization = useSelectedOrganization()

  // billing pages live under /billing/invoices and /billing/subscription, etc
  // so we need to pass the [5]th part of the url to the menu
  const page = router.pathname.includes('billing')
    ? router.pathname.split('/')[5]
    : router.pathname.split('/')[4]

  const {
    projectAuthAll: authEnabled,
    projectEdgeFunctionAll: edgeFunctionsEnabled,
    projectStorageAll: storageEnabled,
    billingInvoices: invoicesEnabled,
  } = useIsFeatureEnabled([
    'project_auth:all',
    'project_edge_function:all',
    'project_storage:all',
    'billing:invoices',
  ])

  const menuRoutes = generateSettingsMenu(ref, project, organization, {
    auth: authEnabled,
    edgeFunctions: edgeFunctionsEnabled,
    storage: storageEnabled,
    invoices: invoicesEnabled,
  })

  useEffect(() => {
    if (ui.selectedProjectRef) {
      meta.extensions.load()
    }
  }, [ui.selectedProjectRef])

  return (
    <ProjectLayout
      title={title || 'Settings'}
      product="Settings"
      productMenu={<ProductMenu page={page} menu={menuRoutes} />}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </ProjectLayout>
  )
}

export default withAuth(observer(SettingsLayout))
