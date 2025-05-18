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

  const fruits = [
    { value: 'Apple', isDisabled: false },
    { value: 'Banana', isDisabled: false },
    { value: 'Cherry', isDisabled: false },
    { value: 'Date', isDisabled: false },
    { value: 'Elderberrie', isDisabled: false },
    { value: 'Fig', isDisabled: false },
    { value: 'Grape', isDisabled: false },
    { value: 'Kiwi', isDisabled: true },
    { value: 'Mango', isDisabled: false },
    { value: 'Strawberry', isDisabled: false },
  ]

  return (
    <MultiSelector values={selectedValues} onValuesChange={setSelectedValues}>
      <MultiSelectorTrigger
        className="w-72"
        label="Select fruits"
        badgeLimit="wrap"
        showIcon={false}
      />
      <MultiSelectorContent>
        <MultiSelectorList>
          {fruits.map(({ value, isDisabled }) => (
            <MultiSelectorItem key={value} value={value} disabled={isDisabled}>
              {value}
            </MultiSelectorItem>
          ))}
        </MultiSelectorList>
      </MultiSelectorContent>
    </MultiSelector>
  )
}
