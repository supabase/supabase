import type { PostgresType } from '@supabase/postgres-meta'
import { isNil, noop } from 'lodash'
import { Select } from 'ui'

import { POSTGRES_DATA_TYPES } from '../SidePanelEditor.constants'
import { ColumnField } from '../SidePanelEditor.types'
import { typeExpressionSuggestions } from './ColumnEditor.constants'
import { Suggestion } from './ColumnEditor.types'
import { getSelectedEnumValues } from './ColumnEditor.utils'
import InputWithSuggestions from './InputWithSuggestions'

interface ColumnDefaultValueProps {
  columnFields: ColumnField
  enumTypes: PostgresType[]
  onUpdateField: (changes: Partial<ColumnField>) => void
}

const ColumnDefaultValue = ({
  columnFields,
  enumTypes = [],
  onUpdateField = noop,
}: ColumnDefaultValueProps) => {
  const suggestions: Suggestion[] = typeExpressionSuggestions?.[columnFields.format] ?? []

  // If selected column type is a user-defined enum, show a dropdown list of options
  const isUserDefinedEnum: boolean =
    isNil(columnFields.format) && !POSTGRES_DATA_TYPES.includes(columnFields.format)

  if (isUserDefinedEnum) {
    const enumValues = getSelectedEnumValues(columnFields.format, enumTypes)
    return (
      <Select
        label="Default Value"
        layout="horizontal"
        value={columnFields.defaultValue ?? ''}
        onChange={(event: any) => onUpdateField({ defaultValue: event.target.value })}
      >
        <Select.Option key="empty-enum" value="">
          ---
        </Select.Option>
        {enumValues.map((value: string) => (
          <Select.Option key={value} value={value}>
            {value}
          </Select.Option>
        ))}
      </Select>
    )
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
