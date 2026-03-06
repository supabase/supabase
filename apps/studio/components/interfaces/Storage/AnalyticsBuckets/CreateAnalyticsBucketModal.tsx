import { Dialog, DialogContent, DialogHeader, DialogSectionSeparator, DialogTitle } from 'ui'
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
      <DialogContent size="medium" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Create {config.singularName} bucket</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <CreateAnalyticsBucketForm type="dialog" onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  )
}
