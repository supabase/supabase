import { Label_Shadcn_ } from 'ui'
import { Textarea } from 'ui'

export default function TextareaWithLabel() {
  return (
    <div className="grid w-full gap-1.5">
      <Label_Shadcn_ htmlFor="message">Your message</Label_Shadcn_>
      <Textarea placeholder="Type your message here." id="message" />
    </div>
  )
}
