import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Handle, Node, NodeProps } from '@xyflow/react'
import { TableEditor } from 'icons'
import {
  Copy,
  DiamondIcon,
  Edit,
  Fingerprint,
  Hash,
  InfoIcon,
  Key,
  MoreVertical,
  Table2,
} from 'lucide-react'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import {
  Button,
  cn,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { useSchemaGraphContext } from './SchemaGraphContext'
import { TableNodeData } from './Schemas.constants'
import { getTableDefinitionAsMarkdown } from './Schemas.utils'
import { buildTableEditorUrl } from '@/components/grid/SupabaseGrid.utils'
import { getTableDefinition } from '@/data/database/table-definition-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { formatSql } from '@/lib/formatSql'

// ReactFlow is scaling everything by the factor of 2
export const TABLE_NODE_WIDTH = 320
export const TABLE_NODE_ROW_HEIGHT = 40

export const TableNode = ({
  id,
  data,
  targetPosition,
  sourcePosition,
  placeholder,
}: NodeProps<Node<TableNodeData>> & { placeholder?: boolean }) => {
  // Important styles is a nasty hack to use Handles (required for edges calculations), but do not show them in the UI.
  // ref: https://github.com/wbkd/react-flow/discussions/2698
  const hiddenNodeConnector = 'h-px! w-px! min-w-0! min-h-0! cursor-grab! border-0! opacity-0!'
  const schemaGraphContext = useSchemaGraphContext()
  const { data: project } = useSelectedProjectQuery()
  const { can: canUpdateColumns } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'columns'
  )
  const router = useRouter()
  const itemHeight = 'h-[22px]'

  const hasEdgesSelected =
    schemaGraphContext.selectedEdge?.source === id || schemaGraphContext.selectedEdge?.target === id

  return (
    <article>
      {data.isForeign ? (
        <header
          className={cn(
            'text-[0.55rem] px-2 py-1 border-[0.5px] rounded-[4px] bg-alternative flex gap-1 items-center',
            hasEdgesSelected ? 'outline outline-1 outline-brand' : undefined
          )}
        >
          {data.name}
          {targetPosition && (
            <Handle
              type="target"
              id={data.name}
              position={targetPosition}
              className={cn(hiddenNodeConnector)}
            />
          )}
        </header>
      ) : (
        <div
          className={cn(
            'border-[0.5px] overflow-hidden rounded-[4px] shadow-xs',
            hasEdgesSelected ? 'outline outline-1 outline-brand' : undefined
          )}
          style={{ width: TABLE_NODE_WIDTH / 2 }}
        >
          <header
            className={cn(
              'text-[0.55rem] pl-2 pr-1 bg-alternative flex gap-2 items-center justify-between',
              itemHeight
            )}
          >
            <div className="min-w-0 flex shrink gap-x-1 items-center">
              <Table2 strokeWidth={1} size={12} className="text-light" />
              <span className="whitespace-nowrap overflow-hidden text-ellipsis" title={data.name}>
                {data.name}
              </span>
            </div>
            {
              // Hide the actions while downloading the schema as png/svg
              !schemaGraphContext.isDownloading ? (
                <div className="flex shrink-0 items-center gap-2">
                  {data.description && (
                    <Tooltip>
                      <TooltipTrigger asChild className="cursor-default ">
                        <InfoIcon size={10} className="text-light" />
                      </TooltipTrigger>
                      <TooltipContent side="top">{data.description}</TooltipContent>
                    </Tooltip>
                  )}

                  {!placeholder && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="text"
                          className="px-0 w-[16px] h-[16px] rounded-sm nodrag nopan"
                        >
                          <MoreVertical size={10} />
                          <span className="sr-only">{data.name} actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="bottom" align="end" className="w-40">
                        <DropdownMenuItem
                          className="flex items-center space-x-2 whitespace-nowrap"
                          onClick={() => schemaGraphContext.onEditTable(data.id)}
                        >
                          <Edit size={12} />
                          <p>Edit table</p>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center space-x-2 whitespace-nowrap"
                          onClick={() =>
                            router.push(
                              buildTableEditorUrl({
                                projectRef: project?.ref,
                                tableId: data.id,
                                schema: data.schema,
                              })
                            )
                          }
                        >
                          <TableEditor size={12} />
                          <p>View in Table Editor</p>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="flex items-center space-x-2 whitespace-nowrap"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(data.name)
                          }}
                        >
                          <Copy size={12} />
                          <span>Copy name</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          key="copy-schema-sql"
                          className="space-x-2"
                          onClick={async (e) => {
                            e.stopPropagation()
                            const toastId = toast.loading('Getting table schema...')

                            const formattedSchema = getTableDefinition({
                              id: data.id,
                              projectRef: project?.ref,
                              connectionString: project?.connectionString,
                            }).then((tableDefinition) => {
                              if (!tableDefinition) {
                                throw new Error('Failed to get table schema')
                              }
                              return formatSql(tableDefinition)
                            })

                            try {
                              await copyToClipboard(formattedSchema, () => {
                                toast.success('Table schema copied to clipboard', { id: toastId })
                              })
                            } catch (err) {
                              toast.error(
                                'Failed to copy schema: ' + ((err as Error).message || err),
                                {
                                  id: toastId,
                                }
                              )
                            }
                          }}
                        >
                          <Copy size={12} />
                          <span>Copy as SQL</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          key="copy-schema-markdown"
                          className="space-x-2"
                          onClick={async (e) => {
                            e.stopPropagation()
                            const markdown = getTableDefinitionAsMarkdown(data)

                            try {
                              await copyToClipboard(markdown, () => {
                                toast.success('Table schema copied to clipboard')
                              })
                            } catch (err) {
                              toast.error(
                                'Failed to copy schema: ' + ((err as Error).message || err)
                              )
                            }
                          }}
                        >
                          <Copy size={12} />
                          <span>Copy as Markdown</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ) : null
            }
          </header>

          {data.columns.map((column) => (
            <div
              className={cn(
                'text-[8px] leading-5 relative flex flex-row justify-items-start',
                'bg-surface-100',
                'border-t',
                'border-t-[0.5px]',
                'hover:bg-scale-500 transition cursor-default',
                'group',
                'pr-1',
                itemHeight
              )}
              data-testid={`${data.name}/${column.name}`}
              key={column.id}
            >
              <div
                className={cn(
                  'gap-[0.24rem] flex mx-2 align-middle items-center justify-start',
                  column.isPrimary && 'basis-1/5'
                )}
              >
                {column.isPrimary && (
                  <Key
                    size={8}
                    strokeWidth={1}
                    className={cn(
                      // 'sb-grid-column-header__inner__primary-key'
                      'shrink-0',
                      'text-light'
                    )}
                  />
                )}
                {column.isNullable && (
                  <DiamondIcon size={8} strokeWidth={1} className="shrink-0 text-light" />
                )}
                {!column.isNullable && (
                  <DiamondIcon
                    size={8}
                    strokeWidth={1}
                    fill="currentColor"
                    className="shrink-0 text-light"
                  />
                )}
                {column.isUnique && (
                  <Fingerprint size={8} strokeWidth={1} className="shrink-0 text-light" />
                )}
                {column.isIdentity && (
                  <Hash size={8} strokeWidth={1} className="shrink-0 text-light" />
                )}
              </div>
              <div className="flex w-full justify-between min-w-0">
                <span
                  className={cn(
                    'text-ellipsis overflow-hidden whitespace-nowrap min-w-0 max-w-[80%]',
                    schemaGraphContext.selectedEdge?.sourceHandle === column.id ||
                      schemaGraphContext.selectedEdge?.targetHandle === column.id
                      ? 'text-brand'
                      : undefined
                  )}
                  title={column.name}
                >
                  {column.name}
                </span>
                <span className="shrink-0 pl-2 pr-1 inline-flex justify-end font-mono text-lighter text-[0.4rem] group-hover:hidden">
                  {column.format}
                </span>
              </div>
              {targetPosition && (
                <Handle
                  type="target"
                  id={column.id}
                  position={targetPosition}
                  className={cn(hiddenNodeConnector)}
                />
              )}
              {sourcePosition && (
                <Handle
                  type="source"
                  id={column.id}
                  position={sourcePosition}
                  className={cn(hiddenNodeConnector)}
                />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="text"
                    // Use opacity to hide the button so that it remains accessible (users can tab to it)
                    className="opacity-0 focus:opacity-100 group-hover:opacity-100 data-open:opacity-100 absolute right-0 top-1/2 -translate-y-1/2 px-0 mr-1 w-[16px] h-[16px] rounded-sm"
                  >
                    <MoreVertical size={10} />
                    <span className="sr-only">
                      {data.name} {column.name} actions
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end" className="w-32">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem
                        disabled={!canUpdateColumns}
                        onClick={() => schemaGraphContext.onEditColumn(data.id, column.id)}
                        className="space-x-2"
                      >
                        <Edit size={12} />
                        <p>Edit column</p>
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    {!canUpdateColumns && (
                      <TooltipContent side="bottom">
                        Additional permissions required to edit column
                      </TooltipContent>
                    )}
                  </Tooltip>

                  <DropdownMenuItem
                    className="space-x-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(column.name)
                    }}
                  >
                    <Copy size={12} />
                    <span>Copy name</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
