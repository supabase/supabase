import { useState } from 'react'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select-2'

export default function MultiSelectDemo() {
  const [selectedValues, setSelectedValues] = useState<string[]>([])

  const fruits = [
    'Apple',
    'Banana',
    'Cherry',
    'Date',
    'Elderberrie',
    'Fig',
    'Grape',
    'Kiwi',
    'Mango',
    'Strawberry',
  ]

  return (
    <MultiSelector values={selectedValues} onValuesChange={setSelectedValues}>
      <MultiSelectorTrigger className="w-72" label="Fruits" />
      <MultiSelectorContent sameWidthAsTrigger>
        <MultiSelectorList>
          {fruits.map((fruit) => (
            <MultiSelectorItem key={fruit} value={fruit}>
              {fruit}
            </MultiSelectorItem>
          ))}
        </MultiSelectorList>
      </MultiSelectorContent>
    </MultiSelector>
  )
}
