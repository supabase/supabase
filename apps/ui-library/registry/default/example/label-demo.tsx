import { Checkbox_Shadcn_, Label_Shadcn_ } from 'ui'

export default function LabelDemo() {
  return (
    <div>
      <div className="flex items-center space-x-2">
        <Checkbox_Shadcn_ id="terms" />
        <Label_Shadcn_ htmlFor="terms">Accept terms and conditions</Label_Shadcn_>
      </div>
    </div>
  )
}
