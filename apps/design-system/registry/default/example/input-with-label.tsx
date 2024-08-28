import { Input_Shadcn_, Label_Shadcn_ } from 'ui'

export default function InputWithLabel() {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label_Shadcn_ htmlFor="email">Email</Label_Shadcn_>
      <Input_Shadcn_ type="email" id="email" placeholder="Email" />
    </div>
  )
}
