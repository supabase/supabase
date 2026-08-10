import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { ConfigStoragePage } from '@/components/interfaces/ConfigStorage/ConfigStoragePage'
import BranchLayout from '@/components/layouts/BranchLayout/BranchLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import type { NextPageWithLayout } from '@/types'

const ConfigStoragePageEntry: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>GitHub Config</PageHeaderTitle>
            <PageHeaderDescription>
              Read and inspect the config managed by the current Git branch
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer className="h-full">
        <ConfigStoragePage />
      </PageContainer>
    </>
  )
}

ConfigStoragePageEntry.getLayout = (page) => (
  <DefaultLayout>
    <BranchLayout>{page}</BranchLayout>
  </DefaultLayout>
)

export default ConfigStoragePageEntry
