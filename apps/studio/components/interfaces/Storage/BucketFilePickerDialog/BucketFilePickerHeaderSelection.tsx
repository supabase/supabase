import { X } from 'lucide-react'
import { Button } from 'ui'

import { useBucketFilePickerStateSnapshot } from './BucketFilePickerState'

export const BucketFilePickerHeaderSelection = () => {
  const { selectedItems, clearSelectedItems } = useBucketFilePickerStateSnapshot()

  return (
    <div className="z-10 flex h-[40px] items-center rounded-t-md bg-primary-bright/70 px-2 py-1 shadow dark:bg-primary-bright/25">
      <Button
        icon={<X size={16} strokeWidth={2} />}
        variant="text"
        onClick={() => clearSelectedItems()}
        aria-label="Clear selected items"
      />
      <div className="ml-1 flex items-center space-x-3">
        <p className="mb-0 text-sm text-foreground">
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedItems.length}</span> items
          selected
        </p>

        <div className="border-r border-primary-bright/40 py-3" />
      </div>
    </div>
  )
}
