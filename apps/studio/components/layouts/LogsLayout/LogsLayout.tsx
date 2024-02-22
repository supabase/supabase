import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import NoPermission from 'components/ui/NoPermission'
import ProductMenu from 'components/ui/ProductMenu'
import { useCheckPermissions, useIsFeatureEnabled, useSelectedProject, withAuth } from 'hooks'
import ProjectLayout from '../'
import { generateLogsMenu } from './LogsMenu.utils'
import { useCollectionsQuery } from 'data/collections/collections-query'
import { Menu } from 'ui'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import CreateCollectionModal from 'components/interfaces/Collections/CreateCollectionModal'
import CollectionMenuItem from 'components/interfaces/Collections/CollectionMenuItem'

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

  const project = useSelectedProject()
  const projectRef = project?.ref || 'default'

  const { data: collections, isLoading: collectionsLoading } = useCollectionsQuery({
    projectRef,
  })

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

          <div className="h-px w-full bg-overlay"></div>
          <div className="py-6">
            <div className="px-3">
              <Menu.Group title="Event Collections" />
            </div>
            {collectionsLoading ? (
              <div className="py-3 px-3 space-y-1.5">
                <ShimmeringLoader />
                <ShimmeringLoader className="w-3/4" />
                <ShimmeringLoader className="w-3/4" />
              </div>
            ) : (
              <div className="px-3 flex flex-col  editor-product-menu">
                <div className="space-y-1">
                  <CreateCollectionModal></CreateCollectionModal>
                  <div className=" py-3">
                    {collections?.map((item) => (
                      <CollectionMenuItem item={item} key={item.id + '-collection-item'} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
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
