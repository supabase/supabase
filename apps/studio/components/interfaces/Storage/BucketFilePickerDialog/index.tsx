import { useBreakpoint } from 'common'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from 'ui'

import { BucketFilePickerExplorer } from './BucketFilePickerExplorer'
import { BucketFilePickerStateContextProvider } from './BucketFilePickerState'
import type { Bucket } from '@/data/storage/buckets-query'

export type BucketsFilePickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedBucket: Bucket
  acceptedFileExtensions?: string[]
  onSelect: (value: string) => void
}

export function BucketsFilePickerDialog({
  open,
  onOpenChange,
  selectedBucket,
  acceptedFileExtensions,
  onSelect,
}: BucketsFilePickerDialogProps) {
  const isMobileLayout = useBreakpoint('lg')

  const handleSelect = (value: string) => {
    onSelect(value)
    onOpenChange(false)
  }

  return (
    <>
      {isMobileLayout ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="flex h-[85vh] flex-col gap-0 p-0">
            <SheetHeader className="flex flex-row items-center gap-2 border-b border-overlay px-4 py-3 text-left">
              <SheetTitle className="min-w-0 flex-1 text-left">Choose a file</SheetTitle>
            </SheetHeader>
            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col px-2 pb-3 pt-2">
              <BucketFilePickerStateContextProvider
                bucket={selectedBucket}
                maxFiles={1}
                acceptedFileExtensions={acceptedFileExtensions}
              >
                <BucketFilePickerExplorer onSelect={handleSelect} />
              </BucketFilePickerStateContextProvider>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent
            size="xxlarge"
            className="flex h-[85vh] max-h-[500px] max-w-5xl flex-col gap-0 overflow-hidden p-0"
          >
            <DialogHeader className="flex flex-row items-center gap-2 border-b border-overlay px-6 py-4">
              <DialogTitle className="min-w-0 flex-1">Choose a file</DialogTitle>
            </DialogHeader>
            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3">
              <BucketFilePickerStateContextProvider
                bucket={selectedBucket}
                maxFiles={1}
                acceptedFileExtensions={acceptedFileExtensions}
              >
                <BucketFilePickerExplorer onSelect={handleSelect} />
              </BucketFilePickerStateContextProvider>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
