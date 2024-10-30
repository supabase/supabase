import { Input_Shadcn_, Label_Shadcn_ } from 'ui'

export default function InputWithText() {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label_Shadcn_ htmlFor="email-2">Email</Label_Shadcn_>
      <Input_Shadcn_ type="email" id="email-2" placeholder="Email" />
      <p className="text-sm text-muted-foreground">Enter your email address.</p>
    </div>
  )
}
