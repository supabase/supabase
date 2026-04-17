import { useParams } from 'common'
import { Button, cn } from 'ui'

import { STORAGE_VIEWS } from '../Storage.constants'
import { useFetchFileUrlQuery } from '../StorageExplorer/useFetchFileUrlQuery'
import { useStoragePreference } from '../StorageExplorer/useStoragePreference'
import { BucketFilePickerColumn } from './BucketFilePickerColumn'
import { BucketFilePickerHeader } from './BucketFilePickerHeader'
import { BucketFilePickerHeaderSelection } from './BucketFilePickerHeaderSelection'
import { PreviewPane } from './BucketFilePickerPreviewPane'
import { useBucketFilePickerStateSnapshot } from './BucketFilePickerState'

export function BucketFilePickerExplorer({ onSelect }: { onSelect: (value: string) => void }) {
  const { ref: projectRef } = useParams()
  const { view } = useStoragePreference(projectRef!)
  const { bucket, selectedItems, columns, selectedFilePreview } = useBucketFilePickerStateSnapshot()

  let path = ''
  if (selectedFilePreview) {
    path = columns
      .slice(0, selectedFilePreview.columnIndex)
      .concat(selectedFilePreview.name)
      .join('/')
  }

  const { data: previewUrl, isLoading } = useFetchFileUrlQuery(
    { path, projectRef: projectRef!, bucket },
    { enabled: !!selectedFilePreview }
  )

  return (
    <div className="flex-1 min-h-0 px-6 pb-6">
      <div className="bg-studio border rounded-md border-overlay flex h-full w-full flex-col">
        {selectedItems.length === 0 ? (
          <BucketFilePickerHeader />
        ) : (
          <BucketFilePickerHeaderSelection />
        )}
        <div className="flex flex-1 min-h-0">
          <div
            className={cn(
              'file-explorer flex flex-grow overflow-x-auto justify-between h-full w-full relative',
              view === STORAGE_VIEWS.LIST && 'flex-col'
            )}
          >
            {view === STORAGE_VIEWS.COLUMNS ? (
              <div className="flex">
                <BucketFilePickerColumn index={0} />
              </div>
            ) : (
              <BucketFilePickerColumn fullWidth index={columns.length} />
            )}
          </div>
          <PreviewPane />
        </div>
      </div>
      <div>
        <Button onClick={() => onSelect(previewUrl!)} disabled={!previewUrl} loading={isLoading}>
          Select
        </Button>
      </div>
    </div>
  )
}
