import { Italic } from 'lucide-react'
import { Toggle_Shadcn_ } from 'ui'

export default function ToggleWithText() {
  return (
    <Toggle_Shadcn_ aria-label="Toggle italic">
      <Italic className="mr-2 h-4 w-4" />
      Italic
    </Toggle_Shadcn_>
  )
}
