import { X } from 'lucide-react'
import { Button } from 'ui'

import { useBucketFilePickerStateSnapshot } from './BucketFilePickerState'

export const BucketFilePickerHeaderSelection = () => {
  const { selectedItems, clearSelectedItems } = useBucketFilePickerStateSnapshot()

  return (
    <div className="z-10 flex h-[40px] items-center rounded-t-md bg-brand-400 px-2 py-1 shadow in-data-[theme*=dark]:bg-brand-500">
      <Button
        icon={<X size={16} strokeWidth={2} />}
        type="text"
        onClick={() => clearSelectedItems()}
        aria-label="Clear selected items"
      />
      <div className="ml-1 flex items-center space-x-3">
        <p className="mb-0 text-sm text-foreground">
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedItems.length}</span> items
          selected
        </p>

        <div className="border-r border-green-900 py-3 opacity-50" />
      </div>
    </div>
  )
}
