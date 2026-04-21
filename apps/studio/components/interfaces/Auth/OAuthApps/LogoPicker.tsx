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

import { BucketFilePickerExplorer } from '../../Storage/BucketFilePickerDialog/BucketFilePickerExplorer'
import { BucketFilePickerStateContextProvider } from '../../Storage/BucketFilePickerDialog/BucketFilePickerState'
import { BucketsPicker } from '../../Storage/BucketsPickerDialog/BucketsPicker'
import type { Bucket } from '@/data/storage/buckets-query'

export type StorageFilePickerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (value: string) => void
}

export function LogoPicker({ open, onOpenChange, onSelect }: StorageFilePickerProps) {
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null)

  const isMobileLayout = useBreakpoint('lg')

  useEffect(() => {
    if (!open) {
      setSelectedBucket(null)
    }
  }, [open])

  const handleSelect = (value: string) => {
    onSelect(value)
    onOpenChange(false)
  }

  return (
    <>
      {isMobileLayout ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="flex h-[85vh] flex-col gap-0 p-0">
            {selectedBucket ? (
              <SheetHeader className="flex flex-row items-center gap-2 border-b border-overlay px-6 py-4">
                <Button
                  type="text"
                  size="tiny"
                  icon={<ChevronLeft size={16} />}
                  className="shrink-0"
                  onClick={() => setSelectedBucket(null)}
                >
                  Buckets
                </Button>
                <SheetTitle className="min-w-0 flex-1">Choose a file</SheetTitle>
              </SheetHeader>
            ) : (
              <SheetHeader className="flex flex-row items-center gap-2 border-b border-overlay px-6 py-4">
                <SheetTitle className="min-w-0 flex-1">Select a bucket</SheetTitle>
              </SheetHeader>
            )}
            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col px-2 pb-3 pt-2">
              {selectedBucket ? (
                <BucketFilePickerStateContextProvider
                  bucket={selectedBucket}
                  maxFiles={1}
                  acceptedFileExtensions={['.png', '.jpg', '.jpeg', '.svg']}
                >
                  <BucketFilePickerExplorer onSelect={handleSelect} />
                </BucketFilePickerStateContextProvider>
              ) : (
                <BucketsPicker onSelectBucket={setSelectedBucket} allowedBucketType="public" />
              )}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent
            size="xxlarge"
            className="flex h-[85vh] max-h-[500px] max-w-5xl flex-col gap-0 overflow-hidden p-0"
          >
            {selectedBucket ? (
              <DialogHeader className="flex flex-row items-center gap-2 border-b border-overlay px-6 py-4 h-[60px]">
                <Button
                  type="text"
                  size="tiny"
                  icon={<ChevronLeft size={16} />}
                  className="shrink-0"
                  onClick={() => setSelectedBucket(null)}
                >
                  Buckets
                </Button>
                <DialogTitle className="min-w-0 flex-1">Choose a file</DialogTitle>
              </DialogHeader>
            ) : (
              <DialogHeader className="flex flex-row items-center gap-2 border-b border-overlay px-6 py-4 h-[60px]">
                <DialogTitle className="min-w-0 flex-1">Select a bucket</DialogTitle>
              </DialogHeader>
            )}

            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3">
              {selectedBucket ? (
                <BucketFilePickerStateContextProvider
                  bucket={selectedBucket}
                  maxFiles={1}
                  acceptedFileExtensions={['.png', '.jpg', '.jpeg', '.svg']}
                >
                  <BucketFilePickerExplorer onSelect={handleSelect} />
                </BucketFilePickerStateContextProvider>
              ) : (
                <BucketsPicker onSelectBucket={setSelectedBucket} allowedBucketType="public" />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
