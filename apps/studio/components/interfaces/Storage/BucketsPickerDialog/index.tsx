import { useBreakpoint } from 'common'
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

import { BucketsPicker } from './BucketsPicker'
import type { AllowedBucketType } from './types'
import type { Bucket } from '@/data/storage/buckets-query'

export type BucketsPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  acceptedFileExtensions?: string[]
  hideUnsupportedFiles?: boolean
  onSelect: (bucket: Bucket) => void
  allowedBucketType: AllowedBucketType
}

export function BucketsPickerDialog({
  open,
  onOpenChange,
  onSelect,
  allowedBucketType,
}: BucketsPickerDialogProps) {
  const isMobileLayout = useBreakpoint('lg')

  return (
    <>
      {isMobileLayout ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="flex h-[85vh] flex-col gap-0 p-0">
            <SheetHeader className="flex flex-row items-center gap-2 border-b border-overlay px-4 py-3 text-left">
              <Button type="text" size="tiny" className="shrink-0">
                Buckets
              </Button>
              <SheetTitle className="min-w-0 flex-1 text-left">Select a bucket</SheetTitle>
            </SheetHeader>
            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col px-2 pb-3 pt-2">
              <BucketsPicker onSelectBucket={onSelect} allowedBucketType={allowedBucketType} />
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
              <Button type="text" size="tiny" className="shrink-0">
                Buckets
              </Button>
              <DialogTitle className="min-w-0 flex-1">Select a bucket</DialogTitle>
            </DialogHeader>
            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3">
              <BucketsPicker onSelectBucket={onSelect} allowedBucketType={allowedBucketType} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
