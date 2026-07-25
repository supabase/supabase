import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { useBucketSnapshotCreateMutation } from '@/data/storage/protection/bucket-snapshots-query'

interface TakeSnapshotModalProps {
  visible: boolean
  projectRef?: string
  bucketId?: string
  onClose: () => void
}

export const TakeSnapshotModal = ({
  visible,
  projectRef,
  bucketId,
  onClose,
}: TakeSnapshotModalProps) => {
  const [name, setName] = useState('')
  const [expiry, setExpiry] = useState<'default' | 'never'>('default')

  const { mutate: createSnapshot, isPending } = useBucketSnapshotCreateMutation({
    onSuccess: () => {
      toast.success('Snapshot queued — it will appear here once complete')
      handleClose()
    },
  })

  const handleClose = () => {
    setName('')
    setExpiry('default')
    onClose()
  }

  const handleSubmit = () => {
    if (!projectRef || !bucketId) return
    createSnapshot({
      projectRef,
      bucketId,
      name: name.trim() || undefined,
      expiryDays: expiry === 'default' ? 90 : null,
    })
  }

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Take snapshot of “{bucketId}”</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className="flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="snapshot-name">
              Name <span className="text-foreground-lighter">(optional)</span>
            </Label>
            <Input
              id="snapshot-name"
              placeholder="e.g. pre-migration"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Expiry</Label>
            <RadioGroup
              value={expiry}
              onValueChange={(value) => setExpiry(value === 'never' ? 'never' : 'default')}
            >
              <div className="flex items-center gap-x-2">
                <RadioGroupItem id="expiry-default" value="default" />
                <Label htmlFor="expiry-default" className="font-normal">
                  90 days (bucket default)
                </Label>
              </div>
              <div className="flex items-center gap-x-2">
                <RadioGroupItem id="expiry-never" value="never" />
                <Label htmlFor="expiry-never" className="font-normal">
                  Keep indefinitely
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Admonition
            type="default"
            title="Captures current versions only"
            description="A snapshot records the current version of each object at this point in time. It does not capture prior versions, and adds to your storage usage until it expires or is deleted."
          />
        </DialogSection>

        <DialogFooter>
          <Button variant="default" disabled={isPending} onClick={handleClose}>
            Cancel
          </Button>
          <Button loading={isPending} onClick={handleSubmit}>
            Take snapshot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
