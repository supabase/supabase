import { ProductMenu } from 'components/ui/ProductMenu'
import { withAuth } from 'hooks/misc/withAuth'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { useGenerateDatabaseMenu } from './DatabaseMenu.utils'

export interface DatabaseLayoutProps {
  title?: string
}

const DATABASE_SECTION_TITLE_BY_ROUTE: Record<string, string> = {
  schemas: 'Schema Visualizer',
  tables: 'Tables',
  functions: 'Functions',
  triggers: 'Triggers',
  types: 'Enumerated Types',
  extensions: 'Extensions',
  indexes: 'Indexes',
  publications: 'Publications',
  roles: 'Roles',
  'column-privileges': 'Column Privileges',
  settings: 'Settings',
  replication: 'Replication',
  backups: 'Backups',
  migrations: 'Migrations',
}

const DatabaseProductMenu = () => {
  const router = useRouter()
  const page = router.pathname.split('/')[4]
  const menu = useGenerateDatabaseMenu()

  return <ProductMenu page={page} menu={menu} />
}

const DatabaseLayout = ({ children, title }: PropsWithChildren<DatabaseLayoutProps>) => {
  const router = useRouter()
  const page = router.pathname.split('/')[4]
  const routeSectionTitle = page !== undefined ? DATABASE_SECTION_TITLE_BY_ROUTE[page] : undefined
  const resolvedTitle = title && title !== 'Database' ? title : routeSectionTitle ?? title

  return (
    <ProjectLayout
      title={resolvedTitle}
      product="Database"
      productMenu={<DatabaseProductMenu />}
      isBlocking={false}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(DatabaseLayout)
