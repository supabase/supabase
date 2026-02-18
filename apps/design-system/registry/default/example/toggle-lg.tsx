import { Italic } from 'lucide-react'
import { Toggle_Shadcn_ } from 'ui'

export default function ToggleLg() {
  return (
    <Toggle_Shadcn_ size="lg" aria-label="Toggle italic">
      <Italic className="h-4 w-4" />
    </Toggle_Shadcn_>
  )
}
