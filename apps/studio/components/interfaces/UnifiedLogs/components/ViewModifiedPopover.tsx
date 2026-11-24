import { XIcon } from 'lucide-react'
import { RefObject } from 'react'
import { Button, Popover, PopoverAnchor, PopoverContent } from 'ui'

import { getViewModifiedDescription } from './LogsViews.utils'

interface ViewModifiedPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  anchorRef: RefObject<HTMLElement | null>
  viewName: string
  canUpdate?: boolean
  canCreate?: boolean
  isPreset?: boolean
  isPending?: boolean
  onUpdate: () => void
  onSaveAsNew: () => void
  onReset: () => void
  onDismiss: () => void
}

export const ViewModifiedPopover = ({
  open,
  onOpenChange,
  anchorRef,
  viewName,
  canUpdate = true,
  canCreate = true,
  isPreset = false,
  isPending = false,
  onUpdate,
  onSaveAsNew,
  onReset,
  onDismiss,
}: ViewModifiedPopoverProps) => {
  const canWrite = canUpdate || canCreate
  const description = getViewModifiedDescription({ viewName, isPreset, canCreate, canUpdate })

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal={false}>
      <PopoverAnchor virtualRef={anchorRef as RefObject<HTMLElement>} />
      <PopoverContent
        align="start"
        side="bottom"
        className="w-80 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={() => onDismiss()}
      >
        <div className="flex items-start justify-between gap-2 px-4 pt-4">
          <h3 className="text-sm text-foreground">This view has been modified</h3>
          <Button
            size="tiny"
            variant="text"
            className="px-1 -mt-1 -mr-1"
            icon={<XIcon size={14} />}
            aria-label="Dismiss"
            onClick={onDismiss}
          />
        </div>

        <p className="text-xs text-foreground-light px-4 pt-1">{description}</p>

        {!canWrite && (
          <p className="text-xs text-foreground-lighter px-4 pt-2">
            Only members with write access can update views.
          </p>
        )}

        <div className="flex items-center justify-end gap-2 px-4 py-3">
          <Button size="tiny" variant="text" onClick={onReset} disabled={isPending}>
            Reset
          </Button>
          {canCreate && (
            <Button size="tiny" variant="default" onClick={onSaveAsNew} disabled={isPending}>
              Save as new
            </Button>
          )}
          {canUpdate && (
            <Button
              size="tiny"
              variant="primary"
              onClick={onUpdate}
              loading={isPending}
              disabled={isPending}
            >
              Update view
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
