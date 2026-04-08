import { useParams } from 'common'
import { useRouter } from 'next/router'
import type { ComponentProps, PropsWithChildren } from 'react'

import { ProjectLayoutV2 } from '../NavigationV2/ProjectLayout'
import { ProjectLayout } from '../ProjectLayout'
import { useIsNavigationV2Enabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ProductMenu } from '@/components/ui/ProductMenu'
import { withAuth } from '@/hooks/misc/withAuth'

export const EdgeFunctionsProductMenu = () => {
  const { ref: projectRef = 'default' } = useParams()
  const router = useRouter()
  const page = router.pathname.split('/')[4]

  const menuItems = [
    {
      title: 'Manage',
      items: [
        {
          name: 'Functions',
          key: 'main',
          pages: ['', '[functionSlug]', 'new'],
          url: `/project/${projectRef}/functions`,
          items: [],
        },
        {
          name: 'Secrets',
          key: 'secrets',
          url: `/project/${projectRef}/functions/secrets`,
          items: [],
        },
      ],
    },
  ]

  return <ProductMenu page={page} menu={menuItems} />
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
  const isNavigationV2 = useIsNavigationV2Enabled()

  if (isNavigationV2) {
    return (
      <ProjectLayoutV2 title="Edge Functions" product="Edge Functions" isBlocking={false}>
        {children}
      </ProjectLayoutV2>
    )
  }

  return (
    <ProjectLayout
      product="Edge Functions"
      browserTitle={{ ...browserTitle, section: title }}
      productMenu={<EdgeFunctionsProductMenu />}
      isBlocking={false}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(EdgeFunctionsLayout)
