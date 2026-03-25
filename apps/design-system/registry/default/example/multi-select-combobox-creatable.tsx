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
  const [selectedValues, setSelectedValues] = useState<string[]>([])

  return (
    <MultiSelector values={selectedValues} onValuesChange={setSelectedValues}>
      <MultiSelectorTrigger className="w-72" label="Select fruits" badgeLimit="wrap" />
      <MultiSelectorContent>
        <MultiSelectorInput placeholder="Search fruits" showResetIcon />
        <MultiSelectorList creatable>
          <MultiSelectorItem value="Mango">Mango</MultiSelectorItem>
          <MultiSelectorItem value="Date">Date</MultiSelectorItem>
          <MultiSelectorItem value="Apple">Apple</MultiSelectorItem>
          <MultiSelectorItem value="Elderberrie">Elderberrie</MultiSelectorItem>
          <MultiSelectorItem value="Fig">Fig</MultiSelectorItem>
          <MultiSelectorItem value="Grape">Grape</MultiSelectorItem>
          <MultiSelectorItem value="Banana">Banana</MultiSelectorItem>
          <MultiSelectorItem value="Kiwi">Kiwi</MultiSelectorItem>
          <MultiSelectorItem value="Strawberry">Strawberry</MultiSelectorItem>
          <MultiSelectorItem value="Cherry">Cherry</MultiSelectorItem>
        </MultiSelectorList>
      </MultiSelectorContent>
    </MultiSelector>
  )
}
