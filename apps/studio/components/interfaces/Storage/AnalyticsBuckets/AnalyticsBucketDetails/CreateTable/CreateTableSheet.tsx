import { Button, Sheet, SheetContent, SheetFooter, SheetHeader, SheetSection, SheetTitle } from 'ui'

interface CreateTableSheetProps {
  open: boolean
  onOpenChange: (value: boolean) => void
}

const formId = 'create-namespace-table'

export const CreateTableSheet = ({ open, onOpenChange }: CreateTableSheetProps) => {
  const isCreating = false
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined} className="flex flex-col gap-0">
        <SheetHeader className="shrink-0 flex items-center gap-4">
          <SheetTitle>Create a</SheetTitle>
        </SheetHeader>
        <SheetSection className="overflow-auto flex-grow px-0">Hello</SheetSection>
        <SheetFooter>
          <Button disabled={isCreating} type="default" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button form={formId} htmlType="submit" loading={isCreating}>
            Create table
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
