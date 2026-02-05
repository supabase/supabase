import { useMemo } from 'react'
import { FormControl_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'
import { ResourceMultiSelectorProps } from './ResourceAccess.types'

export const ResourceMultiSelector = ({
  field,
  items,
  isLoading,
  fieldName,
  label,
  loadingMessage,
  emptyMessage,
}: ResourceMultiSelectorProps) => {
  const idToName = useMemo(() => new Map(items.map((item) => [item.id, item.name])), [items])

  const displayValues = (field.value || []).map((id: string) => idToName.get(id) || id)

  const handleValuesChange = (names: string[]) => {
    const ids = names
      .map((name) => {
        for (const [id, itemName] of idToName.entries()) {
          if (itemName === name) return id
        }
        return name
      })
      .filter(Boolean)
    field.onChange(ids)
  }

  return (
    <FormItemLayout name={fieldName} label={label}>
      <FormControl_Shadcn_ className="overflow-visible">
        <MultiSelector values={displayValues} onValuesChange={handleValuesChange}>
          <MultiSelectorTrigger
            deletableBadge
            showIcon={false}
            mode="inline-combobox"
            label={label}
            badgeLimit="wrap"
          />
          <MultiSelectorContent className="z-50">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-foreground-light">{loadingMessage}</div>
            ) : items.length === 0 ? (
              <div className="px-3 py-2 text-sm text-foreground-light">{emptyMessage}</div>
            ) : (
              <MultiSelectorList>
                {items.map((item) => (
                  <MultiSelectorItem key={item.id} value={item.name}>
                    {item.name}
                  </MultiSelectorItem>
                ))}
              </MultiSelectorList>
            )}
          </MultiSelectorContent>
        </MultiSelector>
      </FormControl_Shadcn_>
    </FormItemLayout>
  )
}
