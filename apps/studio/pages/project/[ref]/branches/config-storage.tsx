import { ConfigStoragePage } from 'components/interfaces/ConfigStorage/ConfigStoragePage'
import BranchLayout from 'components/layouts/BranchLayout/BranchLayout'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

const ConfigStoragePageEntry: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Config Storage</PageHeaderTitle>
            <PageHeaderDescription>
              Browse config snapshots per branch — pushed by <code>supa push</code>
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
