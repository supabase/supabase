import { PermissionAction } from '@supabase/shared-types/out/constants'
import { FeatureFlagContext, useFlag, useParams } from 'common'
import { useRouter } from 'next/router'
import { useContext, useEffect, useMemo, type PropsWithChildren } from 'react'
import { Badge } from 'ui'

import { ProjectLayout } from '../ProjectLayout'
import { NoPermission } from '@/components/ui/NoPermission'
import { ProductMenu } from '@/components/ui/ProductMenu'
import type { ProductMenuGroup } from '@/components/ui/ProductMenu/ProductMenu.types'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { withAuth } from '@/hooks/misc/withAuth'
import { PRODUCT_NAME } from '@/lib/constants/workers'

const useGenerateWorkersMenu = (): ProductMenuGroup[] => {
  const { ref: projectRef = 'default' } = useParams()
  return useMemo(
    () => [
      {
        title: 'Manage',
        items: [
          {
            name: PRODUCT_NAME,
            key: 'main',
            pages: ['', '[name]'],
            url: `/project/${projectRef}/workers`,
            items: [],
          },
          {
            name: 'Secrets',
            key: 'secrets',
            pages: ['secrets'],
            url: `/project/${projectRef}/workers/secrets`,
            items: [],
          },
        ],
      },
    ],
    [projectRef]
  )
}

export const WorkersProductMenu = () => {
  const router = useRouter()
  const page = router.pathname.split('/')[4]
  const menu = useGenerateWorkersMenu()
  return <ProductMenu page={page} menu={menu} />
}

interface WorkersLayoutProps {
  title?: string
}

const WorkersLayoutContent = ({ children, title }: PropsWithChildren<WorkersLayoutProps>) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { hasLoaded } = useContext(FeatureFlagContext)
  const workersEnabled = useFlag('workers')
  // The v2 workers routes require the FGA workers_read permission, which shared-types does not
  // expose yet; they reuse the Edge Functions OAuth scope, so gate on the same product here.
  const { isLoading: isLoadingPermissions, can: canReadWorkers } = useAsyncCheckPermissions(
    PermissionAction.FUNCTIONS_READ,
    '*'
  )

  useEffect(() => {
    if (hasLoaded && !workersEnabled) {
      router.replace(`/project/${projectRef}`)
    }
  }, [router, hasLoaded, workersEnabled, projectRef])

  if (!workersEnabled) return null

  if (isLoadingPermissions) {
    return (
      <ProjectLayout
        isLoading
        product={PRODUCT_NAME}
        browserTitle={{ entity: PRODUCT_NAME, section: title }}
      />
    )
  }

  return (
    <ProjectLayout
      product={PRODUCT_NAME}
      productMenuBadge={<Badge variant="warning">Private Alpha</Badge>}
      productMenu={<WorkersProductMenu />}
      isBlocking={false}
      browserTitle={{ entity: PRODUCT_NAME, section: title }}
    >
      {canReadWorkers ? (
        children
      ) : (
        <NoPermission isFullPage resourceText={`view this project's ${PRODUCT_NAME} workers`} />
      )}
    </ProjectLayout>
  )
}

export const WorkersLayout = withAuth(WorkersLayoutContent)
