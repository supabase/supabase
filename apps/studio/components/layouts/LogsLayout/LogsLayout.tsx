import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { CreateWarehouseCollectionModal } from 'components/interfaces/DataWarehouse/CreateWarehouseCollection'
import { WarehouseMenuItem } from 'components/interfaces/DataWarehouse/WarehouseMenuItem'
import NoPermission from 'components/ui/NoPermission'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useWarehouseCollectionsQuery } from 'data/analytics/warehouse-collections-query'
import { useWarehouseTenantQuery } from 'data/analytics/warehouse-tenant-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { useFlag } from 'hooks/ui/useFlag'
import { Badge, Menu } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateLogsMenu } from './LogsMenu.utils'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { LogsSidebarMenuV2 } from './LogsSidebarMenuV2'
interface LogsLayoutProps {
  title?: string
}

const LogsLayout = ({ title, children }: PropsWithChildren<LogsLayoutProps>) => {
  const router = useRouter()
  const pathArr = router.pathname.split('/')
  const page = pathArr[pathArr.length - 1]

  const {
    projectAuthAll: authEnabled,
    projectStorageAll: storageEnabled,
    realtimeAll: realtimeEnabled,
  } = useIsFeatureEnabled(['project_storage:all', 'project_auth:all', 'realtime:all'])
  const showWarehouse = useFlag('warehouse')

  const enabledFeatures = {
    warehouse: showWarehouse,
    storage: storageEnabled,
    auth: authEnabled,
    realtime: realtimeEnabled,
  }

  const project = useSelectedProject()
  const { ref } = useParams()
  const projectRef = ref as string

  const { data: tenant } = useWarehouseTenantQuery(
    { projectRef },
    {
      enabled: showWarehouse,
    }
  )
  const collectionQueryEnabled = !!tenant
  const { data: collections, isLoading: collectionsLoading } = useWarehouseCollectionsQuery(
    {
      projectRef,
    },
    { enabled: collectionQueryEnabled }
  )

  const canUseLogsExplorer = useCheckPermissions(PermissionAction.ANALYTICS_READ, 'logflare')

  if (!canUseLogsExplorer) {
    return (
      <ProjectLayout>
        <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
          <NoPermission isFullPage resourceText="access your project's logs explorer" />
        </main>
      </ProjectLayout>
    )
  }

  return (
    <ProjectLayout
      title={title}
      product="Logs & Analytics"
      productMenu={<LogsSidebarMenuV2 features={enabledFeatures} />}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </ProjectLayout>
  )
}

export default withAuth(LogsLayout)
