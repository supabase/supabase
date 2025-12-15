import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Input_Shadcn_,
  Label_Shadcn_,
} from 'ui'

export default function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="default">Edit profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader padding={'small'}>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
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
