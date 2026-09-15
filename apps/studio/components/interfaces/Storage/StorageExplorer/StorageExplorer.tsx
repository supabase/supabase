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

  // The bucket query and the effect that syncs it into the store both settle after the
  // first render, so guard against showing the previous bucket's contents in between.
  const isBucketReady = !isBucketQueryLoading && !!bucket && bucketId === selectedBucket.id

  // Search results are deliberately transient — they aren't part of the URL, so a shared
  // link points at a folder rather than at someone else's filter.
  const [itemSearchString, setItemSearchString] = useState('')
  const debouncedSearchString = useDebounce(itemSearchString, 500)

  return (
    <div className="bg-studio flex h-full w-full flex-col">
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
