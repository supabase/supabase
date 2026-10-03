import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { useState } from 'react'

import { useSelectedBucket } from '../FilesBuckets/useSelectedBucket'
import { ArchivedFilesProvider } from './ArchivedFilesContext'
import { StorageExplorerContent } from './StorageExplorerContent'
import { StorageExplorerNavigationProvider } from './StorageExplorerNavigation'
import { useProjectStorageConfigQuery } from '@/data/config/project-storage-config-query'
import { IS_PLATFORM } from '@/lib/constants'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

export const StorageExplorer = () => {
  const { ref, bucketId } = useParams()
  const { selectedBucket } = useStorageExplorerStateSnapshot()

  useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { data: bucket, isLoading: isBucketQueryLoading } = useSelectedBucket()

  // Guards the gap where the query has settled but the store still holds another bucket.
  const isBucketReady = !isBucketQueryLoading && !!bucket && bucketId === selectedBucket.id

  // Deliberately not in the URL, so a shared link points at a folder, not someone's filter.
  const [itemSearchString, setItemSearchString] = useState('')
  const debouncedSearchString = useDebounce(itemSearchString, 500)

  return (
    <ArchivedFilesProvider>
      <div className="bg-studio flex h-full w-full flex-col">
        {/* `aria-live` rather than `role="status"`, which is how toasts announce here. */}
        <span aria-live="polite" aria-atomic="true" className="sr-only">
          {isBucketReady ? 'Bucket contents loaded' : 'Loading bucket contents'}
        </span>
        <StorageExplorerNavigationProvider
          isBucketReady={isBucketReady}
          searchString={debouncedSearchString}
        >
          <StorageExplorerContent
            itemSearchString={itemSearchString}
            setItemSearchString={setItemSearchString}
            isLoading={!isBucketReady}
          />
        </StorageExplorerNavigationProvider>
      </div>
    </ArchivedFilesProvider>
  )
}

StorageExplorer.displayName = 'StorageExplorer'
