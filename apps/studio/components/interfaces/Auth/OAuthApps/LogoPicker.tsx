import { useEffect, useState } from 'react'

import { BucketsFilePickerDialog } from '../../Storage/BucketFilePickerDialog'
import { BucketsPickerDialog } from '../../Storage/BucketsPickerDialog'
import type { Bucket } from '@/data/storage/buckets-query'

export type StorageFilePickerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (value: string) => void
}

export function LogoPicker({ open, onOpenChange, onSelect }: StorageFilePickerProps) {
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null)

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
      {selectedBucket ? (
        <BucketsFilePickerDialog
          open={!!selectedBucket}
          onOpenChange={() => setSelectedBucket(null)}
          selectedBucket={selectedBucket}
          onSelect={handleSelect}
          allowedBucketType="public"
        />
      ) : (
        <BucketsPickerDialog
          open={open}
          onOpenChange={onOpenChange}
          onSelect={setSelectedBucket}
          allowedBucketType="public"
        />
      )}
    </>
  )
}
