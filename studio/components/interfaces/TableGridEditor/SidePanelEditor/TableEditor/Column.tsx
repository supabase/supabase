import { FC } from 'react'
import { isUndefined } from 'lodash'
import {
  Checkbox,
  Input,
  Typography,
  IconX,
  IconMenu,
  Popover,
  IconLink,
  IconSettings,
} from '@supabase/ui'

import { ColumnField, EnumType } from '../SidePanelEditor.types'
import ColumnType from '../ColumnEditor/ColumnType'
import InputWithSuggestions from '../ColumnEditor/InputWithSuggestions'
import { Suggestion } from '../ColumnEditor/ColumnEditor.types'
import { typeExpressionSuggestions } from '../ColumnEditor/ColumnEditor.constants'

/**
 * [Joshen] For context:
 *
 * Fields which primary key columns will not bother with these configurations:
 * - Default value
 * - Is array (I don't think PK columns can be arrays?)
 * - Is nullable (PK columns are NOT NULL)
 * - Is unique (PK columns are unique)
 *
 * Fields which have a foreign key will not bother with these configurations:
 * - Type (The column's type will match the FK's column type)
 * - Is identity
 * - Is array
 *
 * For int fields, they will have this condition:
 * - Cannot be both identity AND array, still checkboxes as they can be toggled off
 */

interface Props {
  column: ColumnField
  enumTypes: EnumType[]
  isNewRecord: boolean
  hasImportContent: boolean
  dragHandleProps?: any
  onEditRelation: (column: any) => void
  onUpdateColumn: (changes: Partial<ColumnField>) => void
  onRemoveColumn: () => void
}

const Column: FC<Props> = ({
  column = {} as ColumnField,
  enumTypes = [] as EnumType[],
  isNewRecord = false,
  hasImportContent = false,
  dragHandleProps = {},
  onEditRelation = () => {},
  onUpdateColumn = () => {},
  onRemoveColumn = () => {},
}) => {
  const suggestions: Suggestion[] = typeExpressionSuggestions?.[column.format] ?? []

  return (
    <div className="w-full flex items-center">
      <div className={`w-[5%] ${!isNewRecord ? 'hidden' : ''}`}>
        <div className="cursor-drag" {...dragHandleProps}>
          <Typography>
            <IconMenu strokeWidth={1} size={15} />
          </Typography>
        </div>
      </div>
      <div className="w-[25%]">
        <div className="flex items-center justify-between w-[95%] border border-gray-500 rounded-md">
          <Input
            value={column.name}
            size="small"
            disabled={hasImportContent}
            className={`table-editor-columns-input bg-white dark:bg-transparent rounded ${
              hasImportContent ? 'opacity-50' : ''
            }`}
            onChange={(event: any) => onUpdateColumn({ name: event.target.value })}
          />
          <div
            className={`
            border-l p-[9px] rounded-r border-gray-500 cursor-pointer transition
            ${column.isPrimaryKey ? 'hover:bg-gray-500' : 'hover:bg-gray-600'}
          `}
            onClick={() => onEditRelation(column)}
          >
            <IconLink
              className={!isUndefined(column.foreignKey) ? 'text-green-400' : ''}
              size={14}
              strokeWidth={!isUndefined(column.foreignKey) ? 2 : 1}
            />
          </div>
        </div>
      </div>
      <div className="w-[25%]">
        <div className="w-[95%]">
          <ColumnType
            value={column.format}
            enumTypes={enumTypes}
            size="small"
            showLabel={false}
            className="table-editor-column-type"
            disabled={!isUndefined(column.foreignKey)}
            onOptionSelect={(format: string) => {
              onUpdateColumn({ format, defaultValue: '' })
            }}
          />
        </div>
      </div>
      <div className={`${isNewRecord ? 'w-[25%]' : 'w-[30%]'}`}>
        <div className="w-[90%]">
          <InputWithSuggestions
            placeholder="NULL"
            size="small"
            value={column.defaultValue}
            disabled={column.format.includes('int') && column.isIdentity}
            className={`bg-white dark:bg-transparent rounded ${
              column.format.includes('int') && column.isIdentity ? 'opacity-50' : ''
            }`}
            suggestions={suggestions}
            suggestionsHeader="Suggested expressions"
            suggestionsWidth={410}
            onChange={(event: any) => onUpdateColumn({ defaultValue: event.target.value })}
            onSelectSuggestion={(suggestion: Suggestion) =>
              onUpdateColumn({ defaultValue: suggestion.name })
            }
          />
        </div>
      </div>
      <div className="w-[10%]">
        <Checkbox
          label=""
          checked={column.isPrimaryKey}
          onChange={() => onUpdateColumn({ isPrimaryKey: !column.isPrimaryKey })}
        />
      </div>
      <div className={`${hasImportContent ? 'w-[10%]' : 'w-[0%]'}`} />
      <div className="w-[5%] flex justify-end">
        {(!column.isPrimaryKey || column.format.includes('int')) && (
          <Popover
            portalled
            className="w-80 pointer-events-auto"
            overlay={[
              <div className="p-4" key={`${column.id}_configuration`}>
                {!column.isPrimaryKey && (
                  <Checkbox
                    label="Is Nullable"
                    description="Specify if the column can assume a NULL value if no value is provided"
                    checked={column.isNullable}
                    onChange={() => onUpdateColumn({ isNullable: !column.isNullable })}
                  />
                )}
                {isNewRecord && (
                  <Checkbox
                    label="Is Unique"
                    description="Enforce if values in the column should be unique across rows"
                    checked={column.isUnique}
                    onChange={() => onUpdateColumn({ isUnique: !column.isUnique })}
                  />
                )}
                {column.format.includes('int') && (
                  <Checkbox
                    label="Is Identity"
                    description="Automatically assign a sequential unique number to the column"
                    checked={column.isIdentity}
                    onChange={() => {
                      const isIdentity = !column.isIdentity
                      const isArray = isIdentity ? false : column.isArray
                      onUpdateColumn({ isIdentity, isArray })
                    }}
                  />
                )}
                {!column.isPrimaryKey && (
                  <Checkbox
                    label="Define as Array"
                    description="Define your column as a variable-length multidimensional array"
                    checked={column.isArray}
                    onChange={() => {
                      const isArray = !column.isArray
                      const isIdentity = isArray ? false : column.isIdentity
                      onUpdateColumn({ isArray, isIdentity })
                    }}
                  />
                )}
              </div>,
            ]}
          >
            <Typography>
              <IconSettings size={18} strokeWidth={1} />
            </Typography>
          </Popover>
        )}
      </div>
      {!hasImportContent && (
        <div className="w-[5%] flex justify-end">
          <div className="cursor-pointer" onClick={() => onRemoveColumn()}>
            <Typography>
              <IconX strokeWidth={1} />
            </Typography>
          </div>
        </div>
      )}
    </div>
  )
}

export default Column
