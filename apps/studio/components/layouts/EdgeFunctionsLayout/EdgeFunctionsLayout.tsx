import { useParams } from 'common'
import { ProductMenu } from 'components/ui/ProductMenu'
import { withAuth } from 'hooks/misc/withAuth'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'
import ProjectLayout from '../ProjectLayout/ProjectLayout'

export interface EdgeFunctionsLayoutProps {
  title?: string
}

const EdgeFunctionsProductMenu = () => {
  const { ref: projectRef = 'default' } = useParams()
  const router = useRouter()
  const page = router.pathname.split('/')[4]

  const menuItems = [
    {
      name: 'Edge Functions',
      key: 'functions',
      url: `/project/${projectRef}/functions`,
      items: [
        {
          name: 'Functions',
          key: 'main',
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

const EdgeFunctionsLayout = ({ title, children }: PropsWithChildren<EdgeFunctionsLayoutProps>) => {
  return (
    <ProjectLayout
      title={title || 'Edge Functions'}
      product="Edge Functions"
      productMenu={<EdgeFunctionsProductMenu />}
      isBlocking={false}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(EdgeFunctionsLayout)
