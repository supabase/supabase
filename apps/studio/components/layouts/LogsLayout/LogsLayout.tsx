import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import NoPermission from 'components/ui/NoPermission'
import { ProductMenu } from 'components/ui/ProductMenu'
import {
  useCheckPermissions,
  useFlag,
  useIsFeatureEnabled,
  useSelectedProject,
  withAuth,
} from 'hooks'
import { ProjectLayout } from '../'
import { generateLogsMenu } from './LogsMenu.utils'
import { Badge, Menu } from 'ui'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { CreateWarehouseCollectionModal } from 'components/interfaces/DataWarehouse/CreateWarehouseCollection'
import { WarehouseMenuItem } from 'components/interfaces/DataWarehouse/WarehouseMenuItem'
import { useWarehouseCollectionsQuery } from 'data/analytics/warehouse-collections-query'
import { useWarehouseTenantQuery } from 'data/analytics/warehouse-tenant-query'
import { useParams } from 'common'
import { GenericSkeletonLoader } from 'ui-patterns'
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
  const project = useSelectedProject()
  const { ref } = useParams()
  const projectRef = ref || 'default'

  const { data: tenant } = useWarehouseTenantQuery(
    { projectRef },
    {
      enabled: showWarehouse,
    }
  )
  const { data: collections, isLoading: collectionsLoading } = useWarehouseCollectionsQuery(
    {
      projectRef: !tenant ? 'undefined' : projectRef,
    },
    { enabled: !!tenant }
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
      product="Logs"
      productMenu={
        <>
          <ProductMenu
            page={page}
            menu={generateLogsMenu(project, {
              auth: authEnabled,
              storage: storageEnabled,
              realtime: realtimeEnabled,
            })}
          />
          {showWarehouse && (
            <>
              <div className="h-px w-full bg-overlay"></div>
              <div className="py-6">
                <div className="px-6 uppercase font-mono">
                  <Menu.Group
                    title={
                      <div>
                        Events
                        <Badge variant="warning" size="small" className="ml-2">
                          New
                        </Badge>
                      </div>
                    }
                  />
                </div>
                <div className="px-3 flex flex-col">
                  <div className="space-y-1">
                    <CreateWarehouseCollectionModal />
                    <div className="py-3">
                      {collectionsLoading ? (
                        <GenericSkeletonLoader />
                      ) : (
                        collections?.map((item) => (
                          <WarehouseMenuItem item={item} key={item.id + '-collection-item'} />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      }
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </ProjectLayout>
  )
}

export default withAuth(LogsLayout)
