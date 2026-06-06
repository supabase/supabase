import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'

import { BUCKET_TYPES } from '../Storage.constants'
import { CreateAnalyticsBucketForm } from './CreateAnalyticsBucketForm'

interface CreateAnalyticsBucketModalProps {
  open: boolean
  onOpenChange: (value: boolean) => void
}

export const CreateAnalyticsBucketModal = ({
  open,
  onOpenChange,
}: CreateAnalyticsBucketModalProps) => {
  const config = BUCKET_TYPES['analytics']

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Create {config.singularName} bucket</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new {config.singularName} bucket and configure it with the form below.
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <CreateAnalyticsBucketForm type="dialog" onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  )
}
