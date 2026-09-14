import { useState } from 'react'
import { type DateRange } from 'react-day-picker'
import {
  Button,
  Calendar,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'ui'

export const LogsCustomRangeDialog = ({
  open,
  onOpenChange,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (range: { from: Date; to: Date }) => void
}) => {
  const [range, setRange] = useState<DateRange | undefined>()

  const canApply = range?.from !== undefined && range?.to !== undefined

  const handleApply = () => {
    if (range?.from === undefined || range?.to === undefined) return
    onApply({ from: range.from, to: range.to })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="large">
        <DialogHeader>
          <DialogTitle>Custom time range</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center overflow-x-auto px-2 py-2">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={2}
            hidden={{ after: new Date() }}
          />
        </div>
        <DialogFooter>
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canApply} onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
