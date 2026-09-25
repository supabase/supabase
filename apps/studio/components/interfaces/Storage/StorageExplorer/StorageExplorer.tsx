import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { useState } from 'react'

import { useSelectedBucket } from '../FilesBuckets/useSelectedBucket'
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
    <div className="bg-studio flex h-full w-full flex-col">
      {/* The skeleton swap is silent, and a live region must be mounted before it changes.
          `aria-live` rather than `role="status"`: that role is how toasts announce
          themselves here, and tests wait on it to tell when an upload has finished. */}
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
  )
}

StorageExplorer.displayName = 'StorageExplorer'
