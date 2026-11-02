import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useMemo, type ComponentProps, type PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { ProductMenu } from '@/components/ui/ProductMenu'
import type { ProductMenuGroup } from '@/components/ui/ProductMenu/ProductMenu.types'
import { ProductMenuShortcuts } from '@/components/ui/ProductMenu/ProductMenuShortcuts'
import { withAuth } from '@/hooks/misc/withAuth'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

const useGenerateEdgeFunctionsMenu = (): ProductMenuGroup[] => {
  const { ref: projectRef = 'default' } = useParams()

  return useMemo(
    () => [
      {
        title: 'Manage',
        items: [
          {
            name: 'Functions',
            key: 'main',
            pages: ['', '[functionSlug]', 'new'],
            url: `/project/${projectRef}/functions`,
            items: [],
            shortcutId: SHORTCUT_IDS.NAV_FUNCTIONS_OVERVIEW,
          },
          {
            name: 'Secrets',
            key: 'secrets',
            url: `/project/${projectRef}/functions/secrets`,
            items: [],
            shortcutId: SHORTCUT_IDS.NAV_FUNCTIONS_SECRETS,
          },
        ],
      },
    ],
    [projectRef]
  )
}

export const EdgeFunctionsProductMenu = () => {
  const router = useRouter()
  const page = router.pathname.split('/')[4]
  const menu = useGenerateEdgeFunctionsMenu()

  return <ProductMenu page={page} menu={menu} />
}

interface EdgeFunctionsLayoutProps {
  title: string
  browserTitle?: ComponentProps<typeof ProjectLayout>['browserTitle']
}

const EdgeFunctionsLayout = ({
  children,
  title,
  browserTitle,
}: PropsWithChildren<EdgeFunctionsLayoutProps>) => {
  const menu = useGenerateEdgeFunctionsMenu()

  return (
    <ProjectLayout
      product="Edge Functions"
      browserTitle={{ ...browserTitle, section: title }}
      productMenu={<EdgeFunctionsProductMenu />}
      isBlocking={false}
    >
      <ProductMenuShortcuts menu={menu} />
      {children}
    </ProjectLayout>
  )
}

export default withAuth(EdgeFunctionsLayout)
