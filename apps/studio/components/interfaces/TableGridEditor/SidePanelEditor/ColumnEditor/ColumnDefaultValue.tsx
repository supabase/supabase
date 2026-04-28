import { noop } from 'lodash'
import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

import { POSTGRES_DATA_TYPES } from '../SidePanelEditor.constants'
import type { ColumnField } from '../SidePanelEditor.types'
import { typeExpressionSuggestions } from './ColumnEditor.constants'
import type { Suggestion } from './ColumnEditor.types'
import InputWithSuggestions from './InputWithSuggestions'
import type { EnumeratedType } from '@/data/enumerated-types/enumerated-types-query'

interface ColumnDefaultValueProps {
  columnFields: ColumnField
  enumTypes: EnumeratedType[]
  onUpdateField: (changes: Partial<ColumnField>) => void
}

const ColumnDefaultValue = ({
  columnFields,
  enumTypes = [],
  onUpdateField = noop,
}: ColumnDefaultValueProps) => {
  const suggestions: Suggestion[] = typeExpressionSuggestions?.[columnFields.format] ?? []

  // If selected column type is a user-defined enum, show a dropdown list of options
  const isEnum: boolean =
    !POSTGRES_DATA_TYPES.includes(columnFields.format) &&
    enumTypes.some((type) => type.name === columnFields.format)

  if (isEnum) {
    const enumType = enumTypes.find((type) => type.name === columnFields.format)
    const enumValues = enumType?.enums ?? []
    const originalDefaultValue = columnFields?.defaultValue ?? ''
    const formattedValue = originalDefaultValue.includes('::')
      ? originalDefaultValue.split('::')[0].slice(1, -1)
      : originalDefaultValue

    if (enumType !== undefined) {
      return (
        <>
          <label className="block text-foreground-light">Default Value</label>
          <Select_Shadcn_
            name="select-editor"
            value={formattedValue}
            onValueChange={(value) => onUpdateField({ defaultValue: value })}
          >
            <SelectTrigger_Shadcn_>
              <SelectValue_Shadcn_ id="select-editor" placeholder="NULL" />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              <SelectGroup_Shadcn_>
                <SelectItem_Shadcn_ value={null as any}>NULL</SelectItem_Shadcn_>
                {enumValues.map((value) => (
                  <SelectItem_Shadcn_ key={value} value={value}>
                    {value}
                  </SelectItem_Shadcn_>
                ))}
              </SelectGroup_Shadcn_>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </>
      )
    }
  }

  return (
    <InputWithSuggestions
      label="Default Value"
      layout="vertical"
      description="Can either be a literal or an expression. When using an expression wrap your expression in brackets, e.g. (gen_random_uuid())"
      placeholder={
        typeof columnFields.defaultValue === 'string' && columnFields.defaultValue.length === 0
          ? 'EMPTY'
          : 'NULL'
      }
      value={columnFields?.defaultValue ?? ''}
      suggestions={suggestions}
      suggestionsHeader="Suggested expressions"
      suggestionsTooltip="Suggested expressions"
      onChange={(event: any) => onUpdateField({ defaultValue: event.target.value })}
      onSelectSuggestion={(suggestion: Suggestion) =>
        onUpdateField({ defaultValue: suggestion.value })
      }
    />
  )
}

export default ColumnDefaultValue
