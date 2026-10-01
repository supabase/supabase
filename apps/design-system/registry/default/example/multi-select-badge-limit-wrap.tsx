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
  const [selectedValues, setSelectedValues] = useState<string[]>([
    'Apple',
    'Banana',
    'Cherry',
    'Date',
    'Elderberrie',
  ])
  const [limit, setLimit] = useState(3)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <Button size="tiny" onClick={() => setLimit((value) => value - 1)} disabled={limit < 1}>
          <Minus size={12} />
        </Button>
        <span className="text-sm font-semibold text-foreground/90">Limit: {limit}</span>
        <Button size="tiny" onClick={() => setLimit((value) => value + 1)}>
          <Plus size={12} />
        </Button>
      </div>
      <MultiSelector values={selectedValues} onValuesChange={setSelectedValues}>
        <MultiSelectorTrigger
          className="w-72"
          label="Select fruits"
          badgeLimit={limit}
          wrapBadges
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
    </div>
  )
}
