import { Button, Input_Shadcn_, Label_Shadcn_ } from 'ui'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from 'ui'

export default function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="outline">Open</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you re done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label_Shadcn_ htmlFor="name" className="text-right">
              Name
            </Label_Shadcn_>
            <Input_Shadcn_ id="name" value="Pedro Duarte" className="col-span-3" readOnly />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label_Shadcn_ htmlFor="username" className="text-right">
              Username
            </Label_Shadcn_>
            <Input_Shadcn_ id="username" value="@peduarte" className="col-span-3" readOnly />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button htmlType="submit" type="secondary">
              Save changes
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
