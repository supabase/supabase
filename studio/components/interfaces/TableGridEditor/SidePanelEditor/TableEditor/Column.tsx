import * as Tooltip from '@radix-ui/react-tooltip'
import type { PostgresType } from '@supabase/postgres-meta'
import {
  Button,
  Checkbox,
  IconArrowRight,
  IconLink,
  IconMenu,
  IconSettings,
  IconX,
  Input,
  Popover,
} from 'ui'

import { FOREIGN_KEY_CASCADE_ACTION } from 'data/database/database-query-constants'
import { noop } from 'lodash'
import { typeExpressionSuggestions } from '../ColumnEditor/ColumnEditor.constants'
import { Suggestion } from '../ColumnEditor/ColumnEditor.types'
import { getForeignKeyCascadeAction } from '../ColumnEditor/ColumnEditor.utils'
import ColumnType from '../ColumnEditor/ColumnType'
import InputWithSuggestions from '../ColumnEditor/InputWithSuggestions'
import { ColumnField } from '../SidePanelEditor.types'

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

interface ColumnProps {
  column: ColumnField
  enumTypes: PostgresType[]
  isNewRecord: boolean
  hasImportContent: boolean
  dragHandleProps?: any
  onEditRelation: (column: any) => void
  onUpdateColumn: (changes: Partial<ColumnField>) => void
  onRemoveColumn: () => void
}

const Column = ({
  column = {} as ColumnField,
  enumTypes = [] as PostgresType[],
  isNewRecord = false,
  hasImportContent = false,
  dragHandleProps = {},
  onEditRelation = noop,
  onUpdateColumn = noop,
  onRemoveColumn = noop,
}: ColumnProps) => {
  const suggestions: Suggestion[] = typeExpressionSuggestions?.[column.format] ?? []

  const settingsCount = [
    column.isNullable ? 1 : 0,
    column.isIdentity ? 1 : 0,
    column.isUnique ? 1 : 0,
    column.isArray ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  return (
    <div className="flex w-full items-center">
      <div className={`w-[5%] ${!isNewRecord ? 'hidden' : ''}`}>
        <div className="cursor-drag" {...dragHandleProps}>
          <IconMenu strokeWidth={1} size={15} />
        </div>
      </div>
      <div className="w-[20%]">
        <div className="flex w-[95%] items-center justify-between">
          <Input
            value={column.name}
            size="small"
            title={column.name}
            disabled={hasImportContent}
            placeholder="column_name"
            className={`table-editor-columns-input bg-white dark:bg-transparent lg:gap-0 ${
              hasImportContent ? 'opacity-50' : ''
            } rounded-md`}
            onChange={(event: any) => onUpdateColumn({ name: event.target.value })}
          />
        </div>
      </div>
      <div className="w-[5%] mr-2.5">
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>
            <Button
              type={column.foreignKey !== undefined ? 'secondary' : 'default'}
              onClick={() => onEditRelation(column)}
              className="px-1 py-2"
            >
              <IconLink size={14} strokeWidth={column.foreignKey !== undefined ? 2 : 1} />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-alternative py-1 px-2 leading-none shadow', // background
                  'border border-background', //border
                ].join(' ')}
              >
                {column.foreignKey === undefined ? (
                  <span className="text-xs text-foreground">Edit foreign key relation</span>
                ) : (
                  <div>
                    <p className="text-xs text-foreground-light">Foreign key relation:</p>
                    <div className="flex items-center space-x-1">
                      <p className="text-xs text-foreground">
                        {column.foreignKey.source_schema}.{column.foreignKey.source_table_name}.
                        {column.foreignKey.source_column_name}
                      </p>
                      <IconArrowRight size="tiny" strokeWidth={1.5} />
                      <p className="text-xs text-foreground">
                        {column.foreignKey.target_table_schema}.
                        {column.foreignKey.target_table_name}.{column.foreignKey.target_column_name}
                      </p>
                    </div>
                    {column.foreignKey.deletion_action !== FOREIGN_KEY_CASCADE_ACTION.NO_ACTION && (
                      <p className="text-xs text-foreground mt-1">
                        On delete: {getForeignKeyCascadeAction(column.foreignKey.deletion_action)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
      <div className="w-[25%]">
        <div className="w-[95%]">
          <ColumnType
            value={column.format}
            enumTypes={enumTypes}
            size="small"
            showLabel={false}
            className="table-editor-column-type lg:gap-0 "
            disabled={column.foreignKey !== undefined}
            onOptionSelect={(format: string) => {
              const defaultValue = format === 'uuid' ? 'gen_random_uuid()' : null
              onUpdateColumn({ format, defaultValue })
            }}
          />
        </div>
      </div>
      <div className={`${isNewRecord ? 'w-[25%]' : 'w-[30%]'}`}>
        <div className="w-[95%]">
          <InputWithSuggestions
            placeholder={
              typeof column.defaultValue === 'string' && column.defaultValue.length === 0
                ? 'EMPTY'
                : 'NULL'
            }
            size="small"
            value={column.defaultValue ?? ''}
            disabled={column.format.includes('int') && column.isIdentity}
            className={`rounded bg-white dark:bg-transparent lg:gap-0 ${
              column.format.includes('int') && column.isIdentity ? 'opacity-50' : ''
            }`}
            suggestions={suggestions}
            suggestionsHeader="Suggested expressions"
            suggestionsTooltip="Suggested expressions"
            onChange={(event: any) => onUpdateColumn({ defaultValue: event.target.value })}
            onSelectSuggestion={(suggestion: Suggestion) =>
              onUpdateColumn({ defaultValue: suggestion.value })
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
      <div className="flex w-[5%] justify-end">
        {(!column.isPrimaryKey || column.format.includes('int')) && (
          <>
            <Popover
              size="xlarge"
              className="pointer-events-auto"
              align="end"
              modal={true}
              header={
                <div className="flex items-center justify-center">
                  <h5 className="text-sm text-foreground">Extra options</h5>
                </div>
              }
              overlay={[
                <div className="flex flex-col space-y-1" key={`${column.id}_configuration`}>
                  {!column.isPrimaryKey && (
                    <>
                      <Checkbox
                        label="Is Nullable"
                        description="Specify if the column can assume a NULL value if no value is provided"
                        checked={column.isNullable}
                        className="p-4"
                        onChange={() => onUpdateColumn({ isNullable: !column.isNullable })}
                      />
                      <Popover.Separator />
                    </>
                  )}

                  {column.isNewColumn && (
                    <>
                      <Checkbox
                        label="Is Unique"
                        description="Enforce if values in the column should be unique across rows"
                        checked={column.isUnique}
                        className="p-4"
                        onChange={() => onUpdateColumn({ isUnique: !column.isUnique })}
                      />
                      <Popover.Separator />
                    </>
                  )}
                  {column.format.includes('int') && (
                    <>
                      <Checkbox
                        label="Is Identity"
                        description="Automatically assign a sequential unique number to the column"
                        checked={column.isIdentity}
                        className="p-4"
                        onChange={() => {
                          const isIdentity = !column.isIdentity
                          const isArray = isIdentity ? false : column.isArray
                          onUpdateColumn({ isIdentity, isArray })
                        }}
                      />
                      <Popover.Separator />
                    </>
                  )}

                  {!column.isPrimaryKey && (
                    <Checkbox
                      label="Define as Array"
                      description="Define your column as a variable-length multidimensional array"
                      checked={column.isArray}
                      className="p-4"
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
              <div className="group flex items-center -space-x-1">
                {settingsCount > 0 && (
                  <div className="rounded-full bg-foreground py-0.5 px-2 text-xs text-background">
                    {settingsCount}
                  </div>
                )}
                <div className="text-foreground-light transition-colors group-hover:text-foreground">
                  <IconSettings size={18} strokeWidth={1} />
                </div>
              </div>
            </Popover>
          </>
        )}
      </div>
      {!hasImportContent && (
        <div className="flex w-[5%] justify-end">
          <button className="cursor-pointer" onClick={() => onRemoveColumn()}>
            <IconX strokeWidth={1} />
          </button>
        </div>
      )}
    </div>
  )
}

export default Column
