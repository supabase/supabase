import { X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, Separator, SheetClose, cn } from 'ui'

interface NewPublicationPanelProps {
  visible: boolean
  onClose: () => void
}

const NewPublicationPanel = ({ visible, onClose }: NewPublicationPanelProps) => {
  return (
    <>
      <Sheet open={visible} onOpenChange={onClose}>
        <SheetContent showClose={false} size="default">
          <SheetHeader>
            <div className="flex flex-row justify-between items-center">
              <SheetTitle>New Publication</SheetTitle>
              <SheetClose
                className={cn(
                  'text-muted hover:opacity-100',
                  'focus:outline-none focus:ring-2',
                  'disabled:pointer-events-none'
                )}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </div>
          </SheetHeader>
          <Separator />
        </SheetContent>
      </Sheet>
    </>
  )
}

export default NewPublicationPanel
