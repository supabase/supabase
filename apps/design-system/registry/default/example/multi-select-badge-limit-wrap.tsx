import { useState } from 'react'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

export default function MultiSelectDemo() {
  const [selectedValues, setSelectedValues] = useState<string[]>([
    'Apple',
    'Banana',
    'Cherry',
    'Date',
    'Elderberrie',
  ])

  return (
    <MultiSelector values={selectedValues} onValuesChange={setSelectedValues}>
      <MultiSelectorTrigger
        className="w-72"
        label="Select fruits"
        persistLabel
        badgeLimit="wrap"
        showIcon={false}
        deletableBadge={false}
      />
      <MultiSelectorContent>
        <MultiSelectorList>
          <MultiSelectorItem value="Apple">Apple</MultiSelectorItem>
          <MultiSelectorItem value="Banana">Banana</MultiSelectorItem>
          <MultiSelectorItem value="Cherry">Cherry</MultiSelectorItem>
          <MultiSelectorItem value="Date">Date</MultiSelectorItem>
          <MultiSelectorItem value="Elderberrie">Elderberrie</MultiSelectorItem>
          <MultiSelectorItem value="Fig">Fig</MultiSelectorItem>
          <MultiSelectorItem value="Grape">Grape</MultiSelectorItem>
          <MultiSelectorItem value="Kiwi">Kiwi</MultiSelectorItem>
          <MultiSelectorItem value="Mango">Mango</MultiSelectorItem>
          <MultiSelectorItem value="Strawberry">Strawberry</MultiSelectorItem>
        </MultiSelectorList>
      </MultiSelectorContent>
    </MultiSelector>
  )
}
