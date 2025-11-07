import { useState } from 'react'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

export default function MultiSelectDemo() {
  const [selectedValues, setSelectedValues] = useState<string[]>([])

  return (
    <MultiSelector values={selectedValues} onValuesChange={setSelectedValues} disabled={true}>
      <MultiSelectorTrigger className="w-72" label="Select fruits" />
    </MultiSelector>
  )
}
