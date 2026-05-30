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
  Input,
  Label,
} from 'ui'

export default function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="default">Edit profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" centered={false}>
        <DialogHeader>
          <DialogTitle>This dialog is not centered.</DialogTitle>
          <DialogDescription>This dialog is not centered.</DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" defaultValue="Pedro Duarte" className="col-span-3" />
          </div>
          <div>
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" defaultValue="@peduarte" className="col-span-3" />
          </div>
        </DialogSection>
        <DialogFooter>
          <Button htmlType="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
