import { useState } from 'react'
import MultiSelectCombobox from 'ui-patterns/multi-select-combobox'

export default function MultiSelectDemo() {
  const [value, setValue] = useState<string[]>([])

  return <MultiSelectCombobox value={value} onChange={setValue} />
}
