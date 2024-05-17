import { Underline } from 'lucide-react'

import { Toggle } from 'ui'

export default function ToggleDisabled() {
  return (
    <Toggle aria-label="Toggle underline" disabled>
      <Underline className="h-4 w-4" />
    </Toggle>
  )
}
