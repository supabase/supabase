import { GitBranch } from 'lucide-react'

import { SchemaGraph } from 'components/interfaces/Database/SchemaGraph'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

const SchemaGraphPage: NextPageWithLayout = () => {
  return (
    <div className="flex flex-col h-full">
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Schema Dependency Graph
            </PageHeaderTitle>
            <PageHeaderDescription>
              Visualize relationships between database objects. Click on any object to highlight its dependencies.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <div className="flex-1 min-h-0">
        <SchemaGraph />
      </div>
    </div>
  )
}

SchemaGraphPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Schema Graph">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default SchemaGraphPage
