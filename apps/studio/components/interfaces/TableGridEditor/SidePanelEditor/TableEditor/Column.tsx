import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Link, Plus, Settings, X } from 'lucide-react'
import { useState } from 'react'
import {
  Badge,
  Button,
  Checkbox,
  cn,
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { ColumnDefaultValue } from '../ColumnEditor/ColumnDefaultValue'
import ColumnType from '../ColumnEditor/ColumnType'
import { ForeignKey } from '../ForeignKeySelector/ForeignKeySelector.types'
import type { ColumnField } from '../SidePanelEditor.types'
import { checkIfRelationChanged } from './ForeignKeysManagement/ForeignKeysManagement.utils'
import { useForeignKeyConstraintsQuery } from '@/data/database/foreign-key-constraints-query'
import type { EnumeratedType } from '@/data/enumerated-types/enumerated-types-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { EMPTY_ARR, EMPTY_OBJ } from '@/lib/void'

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
  relations: ForeignKey[]
  enumTypes: EnumeratedType[]
  isNewRecord: boolean
  hasForeignKeys: boolean
  hasImportContent: boolean
  gridTemplateColumns: string
  shouldAutoFocusName?: boolean
  onUpdateColumn: (changes: Partial<ColumnField>) => void
  onRemoveColumn: () => void
  onEditForeignKey: (relation?: ForeignKey) => void
}

export const Column = ({
  column = EMPTY_OBJ as ColumnField,
  relations = EMPTY_ARR as ForeignKey[],
  enumTypes = EMPTY_ARR as EnumeratedType[],
  isNewRecord = false,
  hasForeignKeys = false,
  hasImportContent = false,
  gridTemplateColumns,
  shouldAutoFocusName = false,
  onUpdateColumn,
  onRemoveColumn,
  onEditForeignKey,
}: ColumnProps) => {
  const { data: project } = useSelectedProjectQuery()
  const [open, setOpen] = useState(false)

  const settingsCount = [
    column.isNullable ? 1 : 0,
    column.isIdentity ? 1 : 0,
    column.isUnique ? 1 : 0,
    column.isArray ? 1 : 0,
    column.isSensitiveData ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const { data } = useForeignKeyConstraintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: column.schema,
  })

  const getRelationStatus = (fk: ForeignKey) => {
    const existingRelation = (data ?? []).find((x) => x.id === fk.id)
    const stateRelation = relations.find((x) => x.id === fk.id)

    if (stateRelation?.toRemove) return 'REMOVE'
    if (existingRelation === undefined && stateRelation !== undefined) return 'ADD'
    if (existingRelation !== undefined && stateRelation !== undefined) {
      const hasUpdated = checkIfRelationChanged(existingRelation, stateRelation)
      if (hasUpdated) return 'UPDATE'
      else return undefined
    }
  }

  const hasChangesInRelations = relations
    .map((r) => getRelationStatus(r))
    .some((x) => x !== undefined)
  const activeRelations = relations.filter((relation) => !relation.toRemove)

  const onToggleSensitiveData = () => {
    const marker = '[SENSITIVE]'
    const isSensitiveData = !column.isSensitiveData
    let updatedComment = column.comment || ''

    if (isSensitiveData && !updatedComment.includes(marker)) {
      updatedComment = `${updatedComment} ${marker}`.trim()
    } else if (!isSensitiveData) {
      updatedComment = updatedComment.replace(marker, '').trim()
    }

    onUpdateColumn({ isSensitiveData, comment: updatedComment })
  }

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } =
    useSortable({
      id: column.id,
    })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      className="grid w-full items-center gap-x-1"
      ref={setNodeRef}
      style={{ ...style, gridTemplateColumns }}
    >
      {isNewRecord && (
        <div className="flex items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="text"
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                tabIndex={0}
                className="w-6.5 px-0 cursor-grab text-foreground"
                icon={<GripVertical size={16} strokeWidth={2} />}
                aria-label={`Move column ${column.name}`}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom">Drag to reorder columns</TooltipContent>
          </Tooltip>
        </div>
      )}
      <div className="min-w-0">
        <div className="flex w-[95%] items-center">
          <InputGroup className="min-w-0 flex-1">
            <InputGroupInput
              autoFocus={shouldAutoFocusName}
              aria-label="Column name"
              size="small"
              value={column.name}
              title={column.name}
              disabled={hasImportContent}
              placeholder="column_name"
              className={hasImportContent ? 'opacity-50' : undefined}
              onChange={(event) => onUpdateColumn({ name: event.target.value })}
            />
            <InputGroupAddon align="inline-end">
              {activeRelations.length === 0 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="text"
                      size="tiny"
                      className="w-6.5 px-0 mr-0.5"
                      onClick={() => onEditForeignKey()}
                      aria-label={`Add foreign key for ${column.name}`}
                    >
                      <Link size={14} strokeWidth={1.5} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Reference a column in another table</TooltipContent>
                </Tooltip>
              ) : (
                <Popover open={open} onOpenChange={setOpen} modal={false}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button
                          variant="text"
                          size="tiny"
                          className="w-6.5 px-0 mr-0.5"
                          aria-label={`Edit ${column.name} foreign keys`}
                        >
                          <Link size={14} strokeWidth={1.5} />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      View and add foreign key relations
                    </TooltipContent>
                  </Tooltip>
                  <PopoverContent
                    className={cn('p-0', hasChangesInRelations ? 'w-96' : 'w-72')}
                    side="bottom"
                    align="center"
                  >
                    <div className="text-xs px-2 pt-2">
                      Involved in {activeRelations.length} foreign key
                      {activeRelations.length > 1 ? 's' : ''}
                    </div>
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          {activeRelations.map((relation, idx) => {
                            const key = String(relation?.id ?? `${column.id}-relation-${idx}`)

                            return (
                              <CommandItem
                                key={key}
                                value={key}
                                className="cursor-pointer w-full"
                                onSelect={() => onEditForeignKey(relation)}
                                onClick={() => onEditForeignKey(relation)}
                              >
                                {status === undefined ? (
                                  <div className="w-full flex items-center justify-between truncate">
                                    {relation.name}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-x-2 truncate">
                                    <Badge variant={status === 'ADD' ? 'success' : 'warning'}>
                                      {status}
                                    </Badge>
                                    <p className="truncate">
                                      {relation.name || (
                                        <>
                                          To{' '}
                                          {relation.columns
                                            .filter((c) => c.source === column.name)
                                            .map((c) => (
                                              <code key={`${c.source}-${c.target}`}>
                                                {relation.schema}.{relation.table}.{c.target}
                                              </code>
                                            ))}
                                          {relation.columns.length > 1 && (
                                            <>
                                              and {relation.columns.length - 1} other column
                                              {relation.columns.length > 2 ? 's' : ''}
                                            </>
                                          )}
                                        </>
                                      )}
                                    </p>
                                  </div>
                                )}
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
                            className="cursor-pointer w-full gap-x-2"
                            onSelect={() => onEditForeignKey()}
                            onClick={() => onEditForeignKey()}
                          >
                            <Plus size={14} strokeWidth={1.5} />
                            <p>Add foreign key relation</p>
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
      <div className="min-w-0">
        <div className="w-[95%]">
          <ColumnType
            value={{ format: column.format, formatSchema: column.formatSchema }}
            enumTypes={enumTypes}
            showLabel={false}
            className="table-editor-column-type lg:gap-0 "
            disabled={hasForeignKeys}
            description={
              hasForeignKeys ? 'Column type cannot be changed as it has a foreign key relation' : ''
            }
            onOptionSelect={({ format, formatSchema }) => {
              const defaultValue = format === 'uuid' ? 'gen_random_uuid()' : null
              onUpdateColumn({ format, formatSchema, defaultValue })
            }}
          />
        </div>
      </div>
      <div className="min-w-0">
        <div className="w-[95%]">
          <ColumnDefaultValue
            columnFields={column}
            enumTypes={enumTypes}
            showLabel={false}
            size="small"
            className={`lg:gap-0 ${
              column.format.includes('int') && column.isIdentity ? 'opacity-50' : ''
            }`}
            data-testid={`${column.name}-default-value`}
            aria-label="Column default value"
            onUpdateField={onUpdateColumn}
          />
        </div>
      </div>
      <div className="min-w-0">
        <Checkbox
          aria-label="Check to make this column a primary key"
          checked={column.isPrimaryKey}
          onCheckedChange={() => {
            const updatedValue = !column.isPrimaryKey
            onUpdateColumn({
              isPrimaryKey: updatedValue,
              isNullable: updatedValue ? false : column.isNullable,
            })
          }}
        />
      </div>
      {hasImportContent && <div />}
      <div className="flex justify-end">
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  data-testid={`${column.name}-extra-options`}
                  variant="outline"
                  aria-label={`Options for ${column.name}`}
                  className="w-6.5 px-0 relative"
                  icon={
                    <>
                      {settingsCount > 0 && (
                        <div className="absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium leading-none tabular-nums text-background">
                          {settingsCount}
                        </div>
                      )}
                      <div className="text-foreground-light transition-colors group-hover:text-foreground">
                        <Settings size={16} strokeWidth={1.75} />
                      </div>
                    </>
                  }
                />
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Set column constraints, array, and masking options
            </TooltipContent>
          </Tooltip>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-center bg-surface-200 gap-y-1 py-1.5 px-3 border-b border-overlay">
              <h5 className="text-foreground">Extra options</h5>
            </div>

            <div className="flex flex-col gap-y-4 p-4" key={`${column.id}_configuration`}>
              {!column.isPrimaryKey && (
                <FormItemLayout
                  isReactForm={false}
                  layout="flex"
                  id="isNullable"
                  label="Is nullable"
                  description="Specify if the column can assume a NULL value if no value is provided"
                >
                  <Checkbox
                    id="isNullable"
                    checked={column.isNullable}
                    onCheckedChange={() => onUpdateColumn({ isNullable: !column.isNullable })}
                  />
                </FormItemLayout>
              )}
              {!column.isPrimaryKey && (
                <FormItemLayout
                  isReactForm={false}
                  layout="flex"
                  id="isUnique"
                  label="Is unique"
                  description="Enforce if values in the column should be unique across rows"
                >
                  <Checkbox
                    id="isUnique"
                    checked={column.isUnique}
                    onCheckedChange={() => onUpdateColumn({ isUnique: !column.isUnique })}
                  />
                </FormItemLayout>
              )}
              {column.format.includes('int') && (
                <FormItemLayout
                  isReactForm={false}
                  layout="flex"
                  id="isIdentity"
                  label="Is Identity"
                  description="Automatically assign a sequential unique number to the column"
                >
                  <Checkbox
                    id="isIdentity"
                    checked={column.isIdentity}
                    onCheckedChange={() => {
                      const isIdentity = !column.isIdentity
                      const isArray = isIdentity ? false : column.isArray
                      onUpdateColumn({ isIdentity, isArray })
                    }}
                  />
                </FormItemLayout>
              )}
              {!column.isPrimaryKey && (
                <FormItemLayout
                  isReactForm={false}
                  layout="flex"
                  id="defineAsArray"
                  label="Define as array"
                  description="Define your column as a variable-length multidimensional array"
                >
                  <Checkbox
                    id="defineAsArray"
                    checked={column.isArray}
                    onCheckedChange={() => {
                      const isArray = !column.isArray
                      const isIdentity = isArray ? false : column.isIdentity
                      onUpdateColumn({ isArray, isIdentity })
                    }}
                  />
                </FormItemLayout>
              )}
              <FormItemLayout
                isReactForm={false}
                layout="flex"
                id={`${column.id}-isSensitiveData`}
                label="Mark as sensitive"
                description="Mask values in the grid display. Database values are unchanged."
              >
                <Checkbox
                  id={`${column.id}-isSensitiveData`}
                  checked={column.isSensitiveData ?? false}
                  onCheckedChange={onToggleSensitiveData}
                />
              </FormItemLayout>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {!hasImportContent && (
        <div className="flex justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                tabIndex={0}
                aria-label={`Remove column ${column.name}`}
                className="w-6.5 px-0 cursor-pointer"
                onClick={() => onRemoveColumn()}
                icon={<X size={16} strokeWidth={1.75} />}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom">Remove this column from the table</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  )
}
