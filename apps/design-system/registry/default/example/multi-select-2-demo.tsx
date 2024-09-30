import { useCallback, useState } from 'react'
import {
  MultiSelector,
  MultiSelectorTrigger,
  MultiSelectorContent,
  MultiSelectorItem,
} from 'ui-patterns/multi-select-2'

export default function MultiSelectDemo() {
  const [selectedProducts, _setSelectedProducts] = useState<string[]>([])
  const [productsOpen, setProductsOpen] = useState(false)

  const onSelectedChange = (
    newItemsOrCreateNewItems: string[] | ((selected: string[]) => string[])
  ) => {
    const newItems =
      typeof newItemsOrCreateNewItems === 'function'
        ? newItemsOrCreateNewItems(selectedProducts)
        : newItemsOrCreateNewItems
    setSelectedProducts(newItems)
  }

  const setSelectedProducts = useCallback(
    (products: string[]) => {
      _setSelectedProducts(products.length === 0 ? [] : products)
    },
    [_setSelectedProducts]
  )

  return (
    <MultiSelector
      open={productsOpen}
      onOpenChange={setProductsOpen}
      selected={selectedProducts}
      onSelectedChange={onSelectedChange}
    >
      <MultiSelectorTrigger className="w-48" label="Products" />
      <MultiSelectorContent sameWidthAsTrigger>
        <MultiSelectorItem value={'Product 1'}>Product 1</MultiSelectorItem>
        <MultiSelectorItem value={'Product 2'}>Product 2</MultiSelectorItem>
        <MultiSelectorItem value={'Product 3'}>Product 3</MultiSelectorItem>
      </MultiSelectorContent>
    </MultiSelector>
  )
}
