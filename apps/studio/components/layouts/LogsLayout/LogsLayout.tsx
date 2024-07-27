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
  const projectRef = ref as string

  const { data: tenant } = useWarehouseTenantQuery(
    { projectRef },
    {
      enabled: showWarehouse,
    }
  )
  const { data: collections, isLoading: collectionsLoading } = useWarehouseCollectionsQuery(
    {
      projectRef,
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
      product="Logs & Analytics"
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
              <div className="h-px w-full bg-border" />
              <div className="py-6">
                <div className="px-6 uppercase font-mono">
                  <Menu.Group
                    title={
                      <div>
                        Warehouse Events
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
                    <div className="pt-3">
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
              <div className="h-px w-full bg-border" />

              <div className="py-6 px-3">
                <Menu.Group
                  title={<span className="uppercase font-mono px-3">Configuration</span>}
                />
                <Link href={`/project/${ref}/settings/warehouse`}>
                  <Menu.Item rounded>
                    <div className="flex px-3 items-center justify-between">
                      <p className="truncate">Warehouse Settings</p>
                      <ArrowUpRight strokeWidth={1} className="h-4 w-4" />
                    </div>
                  </Menu.Item>
                </Link>
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
