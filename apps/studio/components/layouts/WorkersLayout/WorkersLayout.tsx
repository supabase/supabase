import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useMemo, type PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { ProductMenu } from '@/components/ui/ProductMenu'
import type { ProductMenuGroup } from '@/components/ui/ProductMenu/ProductMenu.types'
import { withAuth } from '@/hooks/misc/withAuth'

const useGenerateWorkersMenu = (): ProductMenuGroup[] => {
  const { ref: projectRef = 'default' } = useParams()
  return useMemo(
    () => [
      {
        title: 'Manage',
        items: [
          {
            name: 'Workers',
            key: 'main',
            pages: ['', '[name]', '_states'],
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
  return (
    <ProjectLayout
      product="Workers"
      productMenu={<WorkersProductMenu />}
      isBlocking={false}
      browserTitle={{ entity: 'Workers', section: title }}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(WorkersLayout)
