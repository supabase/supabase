import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'

import { useParams } from 'common'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { useFlag } from 'hooks/ui/useFlag'
import { IS_PLATFORM } from 'lib/constants'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateSettingsMenu } from './SettingsMenu.utils'

interface SettingsLayoutProps {
  title?: string
}

const SettingsLayout = ({ title, children }: PropsWithChildren<SettingsLayoutProps>) => {
  const router = useRouter()
  const { ref } = useParams()
  const project = useSelectedProject()
  const organization = useSelectedOrganization()

  useEffect(() => {
    if (!IS_PLATFORM) {
      router.push('/project/default')
    }
  }, [router])

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

  const warehouseEnabled = useFlag('warehouse')
  const logDrainsEnabled = useFlag('logdrains')
  const diskAndComputeEnabled = useFlag('diskAndComputeForm')

  const menuRoutes = generateSettingsMenu(ref, project, organization, {
    auth: authEnabled,
    edgeFunctions: edgeFunctionsEnabled,
    storage: storageEnabled,
    invoices: invoicesEnabled,
    warehouse: warehouseEnabled,
    logDrains: logDrainsEnabled,
    diskAndCompute: diskAndComputeEnabled,
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
