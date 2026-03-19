import { Sheet, SheetContent, SheetHeader, SheetTitle } from 'ui'
import { BUCKET_TYPES } from '../Storage.constants'
import { CreateAnalyticsBucketForm } from './CreateAnalyticsBucketForm'

interface CreateAnalyticsBucketSheetProps {
  open: boolean
  onOpenChange: (value: boolean) => void
}

export const CreateAnalyticsBucketSheet = ({
  open,
  onOpenChange,
}: CreateAnalyticsBucketSheetProps) => {
  const config = BUCKET_TYPES['analytics']

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined} className="flex flex-col gap-y-0">
        <SheetHeader>
          <SheetTitle>Create {config.singularName} bucket</SheetTitle>
        </SheetHeader>
        <CreateAnalyticsBucketForm type="sheet" onOpenChange={onOpenChange} />
      </SheetContent>
    </Sheet>
  )
}
