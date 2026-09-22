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
import { PRODUCT_NAME } from '@/lib/constants/compute'

const useGenerateComputeMenu = (): ProductMenuGroup[] => {
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
            url: `/project/${projectRef}/compute`,
            items: [],
          },
          {
            name: 'Secrets',
            key: 'secrets',
            url: `/project/${projectRef}/compute/secrets`,
            items: [],
          },
        ],
      },
    ],
    [projectRef]
  )
}

export const ComputeProductMenu = () => {
  const router = useRouter()
  const page = router.pathname.split('/')[4]
  const menu = useGenerateComputeMenu()
  return <ProductMenu page={page} menu={menu} />
}

interface ComputeLayoutProps {
  title?: string
}

const ComputeLayoutContent = ({ children, title }: PropsWithChildren<ComputeLayoutProps>) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { hasLoaded } = useContext(FeatureFlagContext)
  const computeEnabled = useFlag('compute')
  // The v2 compute routes require the FGA workers_read permission, which shared-types does not
  // expose yet; they reuse the Edge Functions OAuth scope, so gate on the same product here.
  const { isLoading: isLoadingPermissions, can: canReadCompute } = useAsyncCheckPermissions(
    PermissionAction.FUNCTIONS_READ,
    '*'
  )

  useEffect(() => {
    if (hasLoaded && !computeEnabled) {
      router.replace(`/project/${projectRef}`)
    }
  }, [router, hasLoaded, computeEnabled, projectRef])

  if (!computeEnabled) return null

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
      productMenu={<ComputeProductMenu />}
      isBlocking={false}
      browserTitle={{ entity: PRODUCT_NAME, section: title }}
    >
      {canReadCompute ? (
        children
      ) : (
        <NoPermission isFullPage resourceText="view this project's compute instances" />
      )}
    </ProjectLayout>
  )
}

export const ComputeLayout = withAuth(ComputeLayoutContent)
