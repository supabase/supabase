import { FeatureFlagContext, useFlag, useParams } from 'common'
import { useRouter } from 'next/router'
import { useContext, useEffect, useMemo, type PropsWithChildren } from 'react'
import { Badge } from 'ui'

import { ProjectLayout } from '../ProjectLayout'
import { ProductMenu } from '@/components/ui/ProductMenu'
import type { ProductMenuGroup } from '@/components/ui/ProductMenu/ProductMenu.types'
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

const WorkersLayout = ({ children, title }: PropsWithChildren<WorkersLayoutProps>) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { hasLoaded } = useContext(FeatureFlagContext)
  const workersEnabled = useFlag('workers')

  useEffect(() => {
    if (hasLoaded && !workersEnabled) {
      router.replace(`/project/${projectRef}`)
    }
  }, [router, hasLoaded, workersEnabled, projectRef])

  if (!workersEnabled) return null

  return (
    <ProjectLayout
      product={PRODUCT_NAME}
      productMenuBadge={<Badge variant="warning">Private Alpha</Badge>}
      productMenu={<WorkersProductMenu />}
      isBlocking={false}
      browserTitle={{ entity: PRODUCT_NAME, section: title }}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(WorkersLayout)
