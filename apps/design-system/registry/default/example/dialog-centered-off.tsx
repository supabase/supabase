import { Button, DialogSection, DialogSectionSeparator } from 'ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'ui'
import { Input_Shadcn_ } from 'ui'
import { Label_Shadcn_ } from 'ui'

export default function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="default">Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" centered={false}>
        <DialogHeader padding={'small'}>
          <DialogTitle>This dialog is not centered.</DialogTitle>
          <DialogDescription>This dialog is not centered.</DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="space-y-4" padding={'small'}>
          <div>
            <Label_Shadcn_ htmlFor="name" className="text-right">
              Name
            </Label_Shadcn_>
            <Input_Shadcn_ id="name" defaultValue="Pedro Duarte" className="col-span-3" />
          </div>
          <div>
            <Label_Shadcn_ htmlFor="username" className="text-right">
              Username
            </Label_Shadcn_>
            <Input_Shadcn_ id="username" defaultValue="@peduarte" className="col-span-3" />
          </div>
        </DialogSection>
        <DialogFooter padding={'small'}>
          <Button htmlType="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
