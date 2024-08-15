import { useState } from 'react'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

export default function MultiSelectDemo() {
  const [value, setValue] = useState<string[]>([])

  return (
    <MultiSelector values={value} onValuesChange={setValue} size="small">
      <MultiSelectorTrigger>
        <MultiSelectorInput placeholder="Select items" />
      </MultiSelectorTrigger>
      <MultiSelectorContent>
        <MultiSelectorList>
          <MultiSelectorItem value="1">Item 1</MultiSelectorItem>
          <MultiSelectorItem value="2">Item 2</MultiSelectorItem>
          <MultiSelectorItem value="3">Item 3</MultiSelectorItem>
        </MultiSelectorList>
      </MultiSelectorContent>
    </MultiSelector>
  )
}
