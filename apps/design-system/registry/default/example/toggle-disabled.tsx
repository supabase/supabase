import { Underline } from 'lucide-react'

import { Toggle_Shadcn_ } from 'ui'

export default function ToggleDisabled() {
  return (
    <Toggle_Shadcn_ aria-label="Toggle underline" disabled>
      <Underline className="h-4 w-4" />
    </Toggle_Shadcn_>
  )
}
