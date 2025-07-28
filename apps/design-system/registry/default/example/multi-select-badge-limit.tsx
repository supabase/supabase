import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from 'ui'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

export default function MultiSelectDemo() {
  const [selectedValues, setSelectedValues] = useState<string[]>(['Apple', 'Banana', 'Cherry'])
  const [limit, setLimit] = useState(2)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <Button size="tiny" type="default" onClick={() => setLimit(limit - 1)} disabled={limit < 1}>
          <Minus size={12} />
        </Button>
        <span className="text-sm text-foreground/90 peer-checked:line-through font-semibold hover:cursor-pointer">
          Limit: {limit}
        </span>
        <Button size="tiny" type="default" onClick={() => setLimit(limit + 1)}>
          <Plus size={12} />
        </Button>
      </div>
      <MultiSelector values={selectedValues} onValuesChange={setSelectedValues}>
        <MultiSelectorTrigger className="w-72" label="Select fruits" badgeLimit={limit} />
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
    </div>
  )
}
