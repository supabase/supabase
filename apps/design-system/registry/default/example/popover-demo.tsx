import {
  Button,
  Input_Shadcn_,
  Label_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'

export default function PopoverDemo() {
  return (
    <Popover_Shadcn_>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type="outline">Open popover</Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-sm text-muted-foreground">Set the dimensions for the layer.</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label_Shadcn_ htmlFor="width">Width</Label_Shadcn_>
              <Input_Shadcn_ id="width" defaultValue="100%" className="col-span-2 h-8" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label_Shadcn_ htmlFor="maxWidth">Max. width</Label_Shadcn_>
              <Input_Shadcn_ id="maxWidth" defaultValue="300px" className="col-span-2 h-8" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label_Shadcn_ htmlFor="height">Height</Label_Shadcn_>
              <Input_Shadcn_ id="height" defaultValue="25px" className="col-span-2 h-8" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label_Shadcn_ htmlFor="maxHeight">Max. height</Label_Shadcn_>
              <Input_Shadcn_ id="maxHeight" defaultValue="none" className="col-span-2 h-8" />
            </div>
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
