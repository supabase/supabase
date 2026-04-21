import { Italic } from 'lucide-react'
import { Toggle_Shadcn_ } from 'ui'

export default function ToggleSm() {
  return (
    <Toggle_Shadcn_ size="sm" aria-label="Toggle italic">
      <Italic className="h-4 w-4" />
    </Toggle_Shadcn_>
  )
}
