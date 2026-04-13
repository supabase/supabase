import { useBreakpoint } from 'common'
import { ChevronLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from 'ui'

import { CreateBucketModal } from '../CreateBucketModal'
import { BucketsListPanel } from '../FilesBuckets/BucketsListPanel'
import { STORAGE_VIEWS } from '../Storage.constants'
import { StorageExplorer } from './StorageExplorer'
import type { StoragePickerReturnValue } from './StorageExplorerPickerContext'
import type { Bucket } from '@/data/storage/buckets-query'
import {
  StorageExplorerEmbeddedStateProvider,
  useStorageExplorerStateSnapshot,
} from '@/state/storage-explorer'

export type StorageFilePickerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectRef: string
  returnValue?: StoragePickerReturnValue
  acceptedFileExtensions?: string[]
  hideUnsupportedFiles?: boolean
  publicBucketsOnly?: boolean
  onSelect: (value: string) => void
  title?: string
}

/** Keeps list view when the picker is in mobile layout (sheet). */
function StoragePickerListViewSync({ enforceList }: { enforceList: boolean }) {
  const { setView } = useStorageExplorerStateSnapshot()

  useEffect(() => {
    if (enforceList) {
      setView(STORAGE_VIEWS.LIST)
    }
  }, [enforceList, setView])

  return null
}

function StorageFilePickerExplorer({
  projectRef,
  bucketId,
  returnValue,
  acceptedFileExtensions,
  hideUnsupportedFiles,
  onSelect,
  forceListView,
}: {
  projectRef: string
  bucketId: string
  returnValue: StoragePickerReturnValue
  acceptedFileExtensions?: string[]
  hideUnsupportedFiles?: boolean
  onSelect: (value: string) => void
  forceListView: boolean
}) {
  return (
    <StorageExplorerEmbeddedStateProvider
      projectRef={projectRef}
      bucketId={bucketId}
      persistExplorerPreferences={false}
      initialView={forceListView ? STORAGE_VIEWS.LIST : undefined}
    >
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <StoragePickerListViewSync enforceList={forceListView} />
        <StorageExplorer
          variant="picker"
          pickerReturnValue={returnValue}
          pickerAcceptedFileExtensions={acceptedFileExtensions}
          pickerHideUnsupportedFiles={hideUnsupportedFiles}
          onPickerPick={onSelect}
          forceListView={forceListView}
          expectedBucketId={bucketId}
          className="h-full min-h-0 flex-1"
        />
      </div>
    </StorageExplorerEmbeddedStateProvider>
  )
}

function StorageFilePickerBucketsStep({
  projectRef,
  onSelectBucket,
  onCreateBucket,
  publicBucketsOnly = false,
}: {
  projectRef: string
  onSelectBucket: (bucket: Bucket) => void
  onCreateBucket: () => void
  publicBucketsOnly?: boolean
}) {
  return (
    <BucketsListPanel
      projectRef={projectRef}
      searchPlaceholder="Search buckets"
      onCreateBucket={onCreateBucket}
      onSelectBucket={onSelectBucket}
      wrapperClassName="flex h-full min-h-0 w-full flex-1 flex-col gap-3"
      tableClassName="min-h-0 flex-1 overflow-hidden"
      publicBucketsOnly={publicBucketsOnly}
    />
  )
}

export function StorageFilePicker({
  open,
  onOpenChange,
  projectRef,
  returnValue = 'objectPath',
  acceptedFileExtensions,
  hideUnsupportedFiles = false,
  publicBucketsOnly = false,
  onSelect,
  title = 'Choose a file',
}: StorageFilePickerProps) {
  const enforcePublicBucketsOnly = publicBucketsOnly || returnValue === 'publicUrl'
  const isMobileLayout = useBreakpoint('lg')
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null)
  const [showCreateBucketModal, setShowCreateBucketModal] = useState(false)

  useEffect(() => {
    if (!open) {
      setSelectedBucket(null)
      setShowCreateBucketModal(false)
    }
  }, [open])

  const handleSelect = (value: string) => {
    onSelect(value)
    onOpenChange(false)
  }

  const pickerTitle = selectedBucket
    ? `${title} — ${selectedBucket.id}`
    : `${title} — choose bucket`

  const headerActions = selectedBucket ? (
    <Button
      type="text"
      size="tiny"
      icon={<ChevronLeft size={16} />}
      onClick={() => setSelectedBucket(null)}
      className="shrink-0"
    >
      Buckets
    </Button>
  ) : null

  const body = selectedBucket ? (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col">
      <StorageFilePickerExplorer
        projectRef={projectRef}
        bucketId={selectedBucket.id}
        returnValue={returnValue}
        acceptedFileExtensions={acceptedFileExtensions}
        hideUnsupportedFiles={hideUnsupportedFiles}
        onSelect={handleSelect}
        forceListView={isMobileLayout}
      />
    </div>
  ) : (
    <StorageFilePickerBucketsStep
      projectRef={projectRef}
      onSelectBucket={setSelectedBucket}
      onCreateBucket={() => setShowCreateBucketModal(true)}
      publicBucketsOnly={enforcePublicBucketsOnly}
    />
  )

  if (isMobileLayout) {
    return (
      <>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="flex h-[85vh] flex-col gap-0 p-0">
            <SheetHeader className="flex flex-row items-center gap-2 border-b border-overlay px-4 py-3 text-left">
              {headerActions}
              <SheetTitle className="min-w-0 flex-1 text-left">{pickerTitle}</SheetTitle>
            </SheetHeader>
            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col px-2 pb-3 pt-2">{body}</div>
          </SheetContent>
        </Sheet>
        <CreateBucketModal open={showCreateBucketModal} onOpenChange={setShowCreateBucketModal} />
      </>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          size="xxlarge"
          className="flex h-[85vh] max-h-[500px] max-w-5xl flex-col gap-0 overflow-hidden p-0"
        >
          <DialogHeader className="flex flex-row items-center gap-2 border-b border-overlay px-6 py-4">
            {headerActions}
            <DialogTitle className="min-w-0 flex-1">{pickerTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3">
            {body}
          </div>
        </DialogContent>
      </Dialog>
      <CreateBucketModal open={showCreateBucketModal} onOpenChange={setShowCreateBucketModal} />
    </>
  )
}

export function useStorageFilePicker() {
  const [open, setOpen] = useState(false)

  return {
    open,
    setOpen,
    pickProps: {
      open,
      onOpenChange: setOpen,
    } as const,
  }
}
