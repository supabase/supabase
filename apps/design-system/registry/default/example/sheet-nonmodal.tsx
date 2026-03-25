import {
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  SheetTrigger,
} from 'ui'

export default function SheetNonmodal() {
  return (
    <Sheet modal={false}>
      <SheetTrigger asChild>
        <Button type="outline">Show Sheet</Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>Log details</SheetTitle>
        </SheetHeader>
        <div className="overflow-auto flex-grow px-0">
          <SheetSection>
            <p className="text-sm text-foreground-lighter">
              This sheet does not block the underlying content, but it does overlap it.
            </p>
          </SheetSection>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
