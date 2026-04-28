import { Checkbox, Label_Shadcn_ } from 'ui'

export default function LabelDemo() {
  return (
    <div>
      <div className="flex items-center space-x-2">
        <Checkbox id="terms" />
        <Label_Shadcn_ htmlFor="terms">Accept terms and conditions</Label_Shadcn_>
      </div>
    </div>
  )
}
