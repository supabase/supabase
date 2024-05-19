import { Bold } from 'lucide-react'

import { Toggle_Shadcn_ } from 'ui'

export default function ToggleDemo() {
  return (
    <Toggle_Shadcn_ aria-label="Toggle bold">
      <Bold className="h-4 w-4" />
    </Toggle_Shadcn_>
  )
}
