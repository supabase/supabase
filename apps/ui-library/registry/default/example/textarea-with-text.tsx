import { Textarea } from 'ui'
import { Label_Shadcn_ } from 'ui'

export default function TextareaWithText() {
  return (
    <div className="grid w-full gap-1.5">
      <Label_Shadcn_ htmlFor="message-2">Your Message</Label_Shadcn_>
      <Textarea placeholder="Type your message here." id="message-2" />
      <p className="text-sm text-muted-foreground">
        Your message will be copied to the support team.
      </p>
    </div>
  )
}
