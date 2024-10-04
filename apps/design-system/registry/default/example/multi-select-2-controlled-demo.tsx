import { useCallback, useState } from 'react'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select-2'

export default function MultiSelectControlledDemo() {
  const [selected, _setSelected] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  const onSelectedChange = (
    newItemsOrCreateNewItems: string[] | ((selected: string[]) => string[])
  ) => {
    const newItems =
      typeof newItemsOrCreateNewItems === 'function'
        ? newItemsOrCreateNewItems(selected)
        : newItemsOrCreateNewItems
    setSelected(newItems)
  }

  const setSelected = useCallback(
    (products: string[]) => {
      _setSelected(products.length === 0 ? [] : products)
    },
    [_setSelected]
  )

  return (
    <MultiSelector
      open={open}
      onOpenChange={setOpen}
      selected={selected}
      onSelectedChange={onSelectedChange}
    >
      <MultiSelectorTrigger className="w-72" label="Fruits" />
      <MultiSelectorContent sameWidthAsTrigger>
        <MultiSelectorList>
          <MultiSelectorItem value="Apple">Apple</MultiSelectorItem>
          <MultiSelectorItem value="Banana">Banana</MultiSelectorItem>
          <MultiSelectorItem value="Grape">Grape</MultiSelectorItem>
          <MultiSelectorItem value="Strawberry">Strawberry</MultiSelectorItem>
        </MultiSelectorList>
      </MultiSelectorContent>
    </MultiSelector>
  )
}
