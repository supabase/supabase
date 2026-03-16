import { ProductMenu } from 'components/ui/ProductMenu'
import { withAuth } from 'hooks/misc/withAuth'
import { useRouter } from 'next/router'
import type { PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { useGenerateDatabaseMenu } from './DatabaseMenu.utils'

export interface DatabaseLayoutProps {
  title: string
}

export const DatabaseProductMenu = () => {
  const router = useRouter()
  const page = router.pathname.split('/')[4]
  const menu = useGenerateDatabaseMenu()

  return <ProductMenu page={page} menu={menu} />
}

const DatabaseLayout = ({ children, title }: PropsWithChildren<DatabaseLayoutProps>) => {
  return (
    <ProjectLayout
      title={title}
      product="Database"
      productMenu={<DatabaseProductMenu />}
      isBlocking={false}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(DatabaseLayout)
