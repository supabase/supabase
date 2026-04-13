import { useParams } from 'common'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { CreateBucketModal } from '../CreateBucketModal'
import { BucketsListPanel } from './BucketsListPanel'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

export const FilesBuckets = () => {
  const { ref } = useParams()
  const snap = useStorageExplorerStateSnapshot()

  const [visible, setVisible] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  return (
    <>
      <PageContainer>
        <PageSection>
          <PageSectionContent className="h-full gap-y-4">
            <BucketsListPanel
              projectRef={ref}
              sortBucket={snap.sortBucket}
              onSortBucketChange={snap.setSortBucket}
              onCreateBucket={() => setVisible(true)}
            />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
      <CreateBucketModal open={visible} onOpenChange={setVisible} />
    </>
  )
}
