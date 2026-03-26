import { PostgresColumn } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { POSTGRES_DATA_TYPE_OPTIONS } from 'components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor.constants'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
import { NoSearchResults } from 'components/ui/NoSearchResults'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { noop } from 'lodash'
import {
  Calendar,
  Edit,
  Fingerprint,
  Hash,
  Key,
  Link as LinkIcon,
  ListPlus,
  MoreVertical,
  Plus,
  Search,
  ToggleRight,
  Trash,
  Type,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  Button,
  Card,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ProtectedSchemaWarning } from '../ProtectedSchemaWarning'

interface ConstraintTokenProps {
  icon?: ReactNode
  label: string
  variant?: 'default' | 'secondary' | 'primary'
}

const constraintTokenClassName =
  'inline-flex items-center justify-center rounded-md text-center font-mono uppercase whitespace-nowrap font-medium tracking-[0.06em] text-[11px] leading-[1.1] px-[5.5px] py-[3px] transition-all border'

const ConstraintToken = ({ icon, label, variant = 'default' }: ConstraintTokenProps) => {
  const tokenToneClassName =
    variant === 'primary'
      ? 'bg-brand bg-opacity-10 text-brand-600 border-brand-500'
      : variant === 'default'
        ? 'bg-surface-75 text-foreground-light border-strong'
        : 'bg-surface-75 bg-opacity-50 text-foreground-light border-strong'

  return (
    <div className="inline-flex items-center whitespace-nowrap">
      {icon && (
        <span
          className={cn(constraintTokenClassName, tokenToneClassName, 'rounded-r-none border-r-0')}
        >
          {icon}
        </span>
      )}
      <span
        className={cn(
          constraintTokenClassName,
          tokenToneClassName,
          icon ? 'rounded-l-none' : 'rounded-md'
        )}
      >
        {label}
      </span>
    </div>
  )
}

const getColumnTypeAffordance = (column: PostgresColumn) => {
  const normalizedFormat = column.format.replaceAll('"', '').replace(/\[\]$/, '')
  const optionType = POSTGRES_DATA_TYPE_OPTIONS.find(
    (option) => option.name === normalizedFormat
  )?.type

  const iconClassName = 'text-foreground-muted'

  switch (optionType) {
    case 'number':
      return {
        icon: <Hash size={14} className={iconClassName} strokeWidth={1.5} />,
        label: 'Numeric',
      }
    case 'time':
      return {
        icon: <Calendar size={14} className={iconClassName} strokeWidth={1.5} />,
        label: 'Date / time',
      }
    case 'text':
      return {
        icon: <Type size={14} className={iconClassName} strokeWidth={1.5} />,
        label: 'Text',
      }
    case 'json':
      return {
        icon: (
          <div className={cn(iconClassName, 'px-px text-[11px] leading-none font-mono')}>
            {'{ }'}
          </div>
        ),
        label: 'JSON',
      }
    case 'bool':
      return {
        icon: <ToggleRight size={14} className={iconClassName} strokeWidth={1.5} />,
        label: 'Boolean',
      }
    default:
      return {
        icon: <ListPlus size={16} className={iconClassName} strokeWidth={1.5} />,
        label: 'Other',
      }
  }
}

interface ColumnListProps {
  onAddColumn: () => void
  onEditColumn: (column: PostgresColumn) => void
  onDeleteColumn: (column: PostgresColumn) => void
}

export const ColumnList = ({
  onAddColumn = noop,
  onEditColumn = noop,
  onDeleteColumn = noop,
}: ColumnListProps) => {
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined

  const { data: project } = useSelectedProjectQuery()
  const {
    data: selectedTable,
    error,
    isError,
    isPending: isLoading,
    isSuccess,
  } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  const [filterString, setFilterString] = useState<string>('')
  const isTableEntity = isTableLike(selectedTable)
  const primaryKeyColumns = new Set(
    isTableEntity ? selectedTable.primary_keys.map((primaryKey) => primaryKey.name) : []
  )
  const foreignKeyColumns = new Set(
    isTableEntity
      ? selectedTable.relationships
          .filter(
            (relationship) =>
              relationship.source_schema === selectedTable.schema &&
              relationship.source_table_name === selectedTable.name
          )
          .map((relationship) => relationship.source_column_name)
      : []
  )
  const uniqueIndexColumns = new Set(
    isTableEntity
      ? (selectedTable.unique_indexes ?? [])
          .filter((uniqueIndex) => uniqueIndex.columns.length === 1)
          .flatMap((uniqueIndex) => uniqueIndex.columns)
      : []
  )

  const columns =
    (filterString.length === 0
      ? (selectedTable?.columns ?? [])
      : selectedTable?.columns?.filter((column) =>
          column.name.toLowerCase().includes(filterString.toLowerCase())
        )) ?? []

  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedTable?.schema ?? '' })
  const { can: canUpdateColumns } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'columns'
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:w-52">
          <Input
            size="tiny"
            placeholder="Filter columns"
            value={filterString}
            onChange={(e) => setFilterString(e.target.value)}
            icon={<Search />}
          />
        </div>
        {!isSchemaLocked && isTableEntity && (
          <ButtonTooltip
            icon={<Plus />}
            disabled={!canUpdateColumns}
            onClick={() => onAddColumn()}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateColumns
                  ? 'You need additional permissions to create columns'
                  : undefined,
              },
            }}
          >
            New column
          </ButtonTooltip>
        )}
      </div>

      {isSchemaLocked && (
        <ProtectedSchemaWarning schema={selectedTable?.schema ?? ''} entity="columns" />
      )}

      <Card>
        {isLoading ? (
          <div className="p-4">
            <GenericSkeletonLoader />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-0 !px-0" />
                <TableHead className={columns.length === 0 ? 'text-foreground-muted' : undefined}>
                  Name
                </TableHead>
                <TableHead className={columns.length === 0 ? 'text-foreground-muted' : undefined}>
                  Type
                </TableHead>
                <TableHead className={columns.length === 0 ? 'text-foreground-muted' : undefined}>
                  Constraints
                </TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isError && (
                <TableRow className="[&>td]:hover:bg-inherit">
                  <TableCell colSpan={5}>
                    <AlertError
                      error={error}
                      subject={`Failed to retrieve columns for table "${selectedTable?.schema}.${selectedTable?.name}"`}
                    />
                  </TableCell>
                </TableRow>
              )}

              {isSuccess && columns.length === 0 && filterString.length > 0 && (
                <TableRow className="[&>td]:hover:bg-inherit">
                  <TableCell colSpan={5}>
                    <NoSearchResults
                      withinTableCell
                      searchString={filterString}
                      onResetFilter={() => setFilterString('')}
                    />
                  </TableCell>
                </TableRow>
              )}

              {isSuccess && columns.length === 0 && filterString.length === 0 && (
                <TableRow className="[&>td]:hover:bg-inherit">
                  <TableCell colSpan={5}>
                    <p className="text-sm text-foreground">No columns created yet</p>
                    <p className="text-sm text-foreground-light">
                      There are no columns in "{selectedTable?.schema}.{selectedTable?.name}"
                    </p>
                  </TableCell>
                </TableRow>
              )}

              {isSuccess &&
                columns.length > 0 &&
                columns.map((column) => {
                  const { icon: TypeIcon, label: typeLabel } = getColumnTypeAffordance(column)
                  const constraintTokens = [
                    primaryKeyColumns.has(column.name) ? (
                      <ConstraintToken
                        key="primary"
                        icon={<Key size={12} strokeWidth={1.7} className="shrink-0" />}
                        label="Primary"
                        variant="primary"
                      />
                    ) : null,
                    foreignKeyColumns.has(column.name) ? (
                      <ConstraintToken
                        key="foreign-key"
                        icon={
                          <LinkIcon
                            size={12}
                            strokeWidth={1.7}
                            className="shrink-0 text-foreground-muted"
                          />
                        }
                        label="Foreign key"
                      />
                    ) : null,
                    column.is_unique || uniqueIndexColumns.has(column.name) ? (
                      <ConstraintToken
                        key="unique"
                        icon={
                          <Fingerprint
                            size={12}
                            strokeWidth={1.7}
                            className="shrink-0 text-foreground-light"
                          />
                        }
                        label="Unique"
                      />
                    ) : null,
                    column.is_identity ? (
                      <ConstraintToken
                        key="identity"
                        icon={
                          <Hash
                            size={12}
                            strokeWidth={1.7}
                            className="shrink-0 text-foreground-lighter"
                          />
                        }
                        label="Identity"
                      />
                    ) : null,
                    <ConstraintToken
                      key="nullability"
                      label={column.is_nullable ? 'Nullable' : 'Required'}
                      variant="secondary"
                    />,
                  ].filter(Boolean)

                  return (
                    <TableRow key={column.name}>
                      <TableCell className="w-0 !pl-5 !pr-1">
                        <Tooltip>
                          <TooltipTrigger className="cursor-default">
                            <div aria-label={typeLabel} className="flex w-4 justify-center">
                              {TypeIcon}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <div className="flex flex-col">
                              <span>{column.data_type}</span>
                              {column.format !== column.data_type && (
                                <span className="text-xs text-foreground-light">
                                  {column.format}
                                </span>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-0 flex-col">
                          <p>{column.name}</p>
                          {column.comment !== null ? (
                            <span
                              className="max-w-md truncate text-foreground-lighter"
                              title={column.comment}
                            >
                              {column.comment}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-foreground-lighter">{column.format}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">{constraintTokens}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        {!isSchemaLocked && isTableEntity && (
                          <div className="flex justify-end gap-2">
                            <ButtonTooltip
                              type="default"
                              disabled={!canUpdateColumns}
                              onClick={() => onEditColumn(column)}
                              tooltip={{
                                content: {
                                  side: 'bottom',
                                  text: !canUpdateColumns
                                    ? 'Additional permissions required to edit column'
                                    : undefined,
                                },
                              }}
                            >
                              Edit
                            </ButtonTooltip>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button type="default" className="px-1" icon={<MoreVertical />} />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent side="bottom" align="end" className="w-32">
                                <DropdownMenuItemTooltip
                                  disabled={!canUpdateColumns || isSchemaLocked}
                                  onClick={() => onDeleteColumn(column)}
                                  className="gap-x-2"
                                  tooltip={{
                                    content: {
                                      side: 'left',
                                      text: 'Additional permissions required to delete column',
                                    },
                                  }}
                                >
                                  <Trash size={12} />
                                  <p>Delete column</p>
                                </DropdownMenuItemTooltip>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
            {isSuccess && (
              <TableFooter className="font-normal">
                <TableRow className="border-b-0 [&>td]:hover:bg-inherit">
                  <TableCell colSpan={5} className="text-foreground-muted">
                    {columns.length} {columns.length === 1 ? 'column' : 'columns'}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        )}
      </Card>
    </div>
  )
}
