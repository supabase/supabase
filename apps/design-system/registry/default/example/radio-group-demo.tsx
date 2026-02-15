import { Label_Shadcn_, RadioGroup_Shadcn_, RadioGroupItem_Shadcn_ } from 'ui'

export default function RadioGroupDemo() {
  return (
    <RadioGroup_Shadcn_ defaultValue="comfortable">
      <div className="flex items-center space-x-2">
        <RadioGroupItem_Shadcn_ value="default" id="r1" />
        <Label_Shadcn_ htmlFor="r1">Default</Label_Shadcn_>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem_Shadcn_ value="comfortable" id="r2" />
        <Label_Shadcn_ htmlFor="r2">Comfortable</Label_Shadcn_>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem_Shadcn_ value="compact" id="r3" />
        <Label_Shadcn_ htmlFor="r3">Compact</Label_Shadcn_>
      </div>
    </RadioGroup_Shadcn_>
  )
}
