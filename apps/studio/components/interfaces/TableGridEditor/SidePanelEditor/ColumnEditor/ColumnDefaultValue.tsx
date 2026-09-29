import { noop } from 'lodash'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from 'ui'

import { POSTGRES_DATA_TYPES } from '../SidePanelEditor.constants'
import type { ColumnField } from '../SidePanelEditor.types'
import { nullSuggestion, typeExpressionSuggestions } from './ColumnEditor.constants'
import type { Suggestion } from './ColumnEditor.types'
import InputWithSuggestions from './InputWithSuggestions'
import type { EnumeratedType } from '@/data/enumerated-types/enumerated-types-query'

const getDefaultValueSuggestions = (format: string, isNullable: boolean): Suggestion[] => {
  const nullableSuggestion: Suggestion[] = isNullable ? [nullSuggestion] : []
  return nullableSuggestion.concat(typeExpressionSuggestions?.[format] ?? [])
}

interface ColumnDefaultValueProps {
  columnFields: ColumnField
  enumTypes: EnumeratedType[]
  className?: string
  size?: 'small' | 'tiny' | 'medium' | 'large'
  showLabel?: boolean
  layout?: 'horizontal' | 'vertical'
  'data-testid'?: string
  'aria-label'?: string
  onUpdateField: (changes: Partial<ColumnField>) => void
}

export const ColumnDefaultValue = ({
  columnFields,
  enumTypes = [],
  className,
  size,
  showLabel = true,
  layout = 'vertical',
  'data-testid': dataTestId,
  'aria-label': ariaLabel,
  onUpdateField = noop,
}: ColumnDefaultValueProps) => {
  const { format, isNullable, isIdentity } = columnFields
  const suggestions: Suggestion[] = getDefaultValueSuggestions(format, isNullable)
  // Identity columns have their default value assigned by Postgres, so it isn't user-editable
  const disabled = format.includes('int') && isIdentity

  // If selected column type is a user-defined enum, show a dropdown list of options
  const isEnum: boolean =
    !POSTGRES_DATA_TYPES.includes(format) && enumTypes.some((type) => type.name === format)

  if (isEnum) {
    const enumType = enumTypes.find((type) => type.name === format)
    const enumValues = enumType?.enums ?? []
    const originalDefaultValue = columnFields?.defaultValue ?? ''
    const formattedValue = originalDefaultValue.includes('::')
      ? originalDefaultValue.split('::')[0].slice(1, -1)
      : originalDefaultValue

    if (enumType !== undefined) {
      return (
        <>
          {showLabel && (
            <label htmlFor="select-editor" className="block text-foreground-light">
              Default Value
            </label>
          )}
          <Select
            name="select-editor"
            value={formattedValue}
            onValueChange={(value) => onUpdateField({ defaultValue: value })}
          >
            <SelectTrigger
              size={size}
              className={className}
              data-testid={dataTestId}
              aria-label={ariaLabel}
            >
              <SelectValue id="select-editor" placeholder="NULL" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {/* @ts-ignore: value being null is valid in this context */}
                {isNullable && <SelectItem value={null}>NULL</SelectItem>}
                {enumValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </>
      )
    }
  }

  return (
    <InputWithSuggestions
      label={showLabel ? 'Default Value' : undefined}
      layout={layout}
      description={
        showLabel
          ? 'Can either be a literal or an expression. When using an expression wrap your expression in brackets, e.g. (gen_random_uuid())'
          : undefined
      }
      placeholder={
        typeof columnFields.defaultValue === 'string' && columnFields.defaultValue.length === 0
          ? 'EMPTY'
          : 'NULL'
      }
      size={size}
      disabled={disabled}
      className={className}
      data-testid={dataTestId}
      aria-label={ariaLabel}
      value={columnFields?.defaultValue ?? ''}
      suggestions={suggestions}
      suggestionsHeader="Suggested expressions"
      suggestionsTooltip="Suggested expressions"
      onChange={(event) => onUpdateField({ defaultValue: event.target.value })}
      onSelectSuggestion={(suggestion: Suggestion) =>
        onUpdateField({ defaultValue: suggestion.value })
      }
    />
  )
}
