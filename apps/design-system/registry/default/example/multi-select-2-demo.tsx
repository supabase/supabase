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
    { name: 'Apple', value: 'Apple' },
    { name: 'Banana', value: 'Banana' },
    { name: 'Cherry', value: 'Cherry' },
    { name: 'Date', value: 'Date' },
    { name: 'Elderberrie', value: 'Elderberrie' },
    { name: 'Fig', value: 'Fig' },
    { name: 'Grape', value: 'Grape' },
    { name: 'Kiwi', value: 'Kiwi' },
    { name: 'Mango', value: 'Mango' },
    { name: 'Strawberry', value: 'Strawberry' },
  ]

  return (
    <MultiSelector values={selectedValues} onValuesChange={setSelectedValues}>
      <MultiSelectorTrigger className="w-72" label="Fruits" />
      <MultiSelectorContent sameWidthAsTrigger>
        <MultiSelectorList>
          {fruits.map((fruit) => (
            <MultiSelectorItem key={fruit.value} value={fruit.value}>
              {fruit.name}
            </MultiSelectorItem>
          ))}
        </MultiSelectorList>
      </MultiSelectorContent>
    </MultiSelector>
  )
}
