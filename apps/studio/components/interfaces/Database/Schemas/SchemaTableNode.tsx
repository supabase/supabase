import {
  DiamondIcon,
  ExternalLink,
  Eye,
  Fingerprint,
  Hash,
  Key,
  Lock,
  Table2,
  Unlock,
} from 'lucide-react'
import Link from 'next/link'
import { Handle, NodeProps } from 'reactflow'

import { PostgresPolicy } from '@supabase/postgres-meta'
import {
  Button,
  cn,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Separator,
} from 'ui'

// ReactFlow is scaling everything by the factor of 2
const TABLE_NODE_WIDTH = 320
const TABLE_NODE_ROW_HEIGHT = 40

export type TableNodeData = {
  id?: number
  name: string
  ref: string
  isForeign: boolean
  columns: {
    id: string
    isPrimary: boolean
    isNullable: boolean
    isUnique: boolean
    isIdentity: boolean
    name: string
    format: string
  }[]
  policies?: PostgresPolicy[]
  rls_enabled: boolean
}

const TableNode = ({ data, targetPosition, sourcePosition }: NodeProps<TableNodeData>) => {
  // Important styles is a nasty hack to use Handles (required for edges calculations), but do not show them in the UI.
  // ref: https://github.com/wbkd/react-flow/discussions/2698
  const hiddenNodeConnector = '!h-px !w-px !min-w-0 !min-h-0 !cursor-grab !border-0 !opacity-0'

  const itemHeight = 'h-[22px]'
  console.log('the data', { data })

  return (
    <>
      {data.isForeign ? (
        <header className="text-[0.55rem] px-2 py-1 border-[0.5px] rounded-[4px] bg-alternative text-default flex gap-1 items-center">
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
          className="border-[0.5px] overflow-hidden rounded-[4px] shadow-sm"
          style={{ width: TABLE_NODE_WIDTH / 2 }}
        >
          <header
            className={cn(
              'text-[0.55rem] pl-2 pr-1 bg-alternative text-default flex items-center justify-between',
              itemHeight
            )}
          >
            <div className="flex gap-x-1 items-center">
              <Table2 strokeWidth={1} size={12} className="text-light" />
              {data.name}
            </div>
            {data.id && (
              <Button asChild type="text" className="px-0 w-[16px] h-[16px] rounded">
                <Link href={`/project/${data.ref}/editor/${data.id}`}>
                  <ExternalLink size={10} className="text-foreground-light" />
                </Link>
              </Button>
            )}
          </header>

          {data.columns.map((column) => (
            <div
              className={cn(
                'text-[8px] leading-5 relative flex flex-row justify-items-start',
                'bg-surface-100',
                'border-t',
                'border-t-[0.5px]',
                'hover:bg-scale-500 transition cursor-default',
                itemHeight
              )}
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
                      'flex-shrink-0',
                      'text-light'
                    )}
                  />
                )}
                {column.isNullable && (
                  <DiamondIcon size={8} strokeWidth={1} className="flex-shrink-0 text-light" />
                )}
                {!column.isNullable && (
                  <DiamondIcon
                    size={8}
                    strokeWidth={1}
                    fill="currentColor"
                    className="flex-shrink-0 text-light"
                  />
                )}
                {column.isUnique && (
                  <Fingerprint size={8} strokeWidth={1} className="flex-shrink-0 text-light" />
                )}
                {column.isIdentity && (
                  <Hash size={8} strokeWidth={1} className="flex-shrink-0 text-light" />
                )}
              </div>
              <div className="flex w-full justify-between">
                <span className="text-ellipsis overflow-hidden whitespace-nowrap max-w-[85px]">
                  {column.name}
                </span>
                <span className="px-2 inline-flex justify-end font-mono text-lighter text-[0.4rem]">
                  {column.format}
                </span>
              </div>
              {targetPosition && (
                <Handle
                  type="target"
                  id={column.id}
                  position={targetPosition}
                  className={cn(hiddenNodeConnector, '!left-0')}
                />
              )}
              {sourcePosition && (
                <Handle
                  type="source"
                  id={column.id}
                  position={sourcePosition}
                  className={cn(hiddenNodeConnector, '!right-0')}
                />
              )}
            </div>
          ))}
          {!data.rls_enabled ? (
            <div className="text-[7px] flex items-center gap-2 px-2 leading-5 relative flex-row justify-items-start border-t-[0.5px] bg-surface-200  cursor-default h-[22px]">
              <Unlock size={8} strokeWidth={1} className="flex-shrink-0 text-warning-600" />
              <span className="text-foreground-lighter">RLS disabled</span>
            </div>
          ) : (
            <>
              {(!data.policies || data.policies.length === 0) && (
                <div className="text-[7px] flex items-center gap-2 px-2 leading-5 relative flex-row justify-items-start border-t-[0.5px] bg-surface-200  cursor-default h-[22px]">
                  <Lock size={8} strokeWidth={1} className="flex-shrink-0 text-brand-600" />
                  <span className="text-foreground-lighter">RLS enabled, no policies created.</span>
                </div>
              )}
              {data.policies && data.policies.length > 0 && (
                <div className="border-t-[0.5px]">
                  {data.policies.map((policy) => (
                    <>
                      <div
                        key={policy.id}
                        className={cn(
                          'text-[7px] leading-3 px-2 flex items-center gap-2 text-foreground-light',
                          'bg-surface-100 ',
                          'hover:bg-scale-500 transition cursor-default',
                          itemHeight
                        )}
                      >
                        <Lock size={8} strokeWidth={1} className="flex-shrink-0 text-brand-600" />
                        <span className="truncate max-w-28">{policy.name}</span>

                        <Popover_Shadcn_>
                          <PopoverTrigger_Shadcn_ asChild className="ml-auto">
                            <Button type="text" className="px-0 w-[16px] h-[16px] rounded">
                              <Eye size={10} className="text-foreground-light" strokeWidth={1.25} />
                            </Button>
                          </PopoverTrigger_Shadcn_>
                          <PopoverContent_Shadcn_ className="w-48 p-0" side="bottom" align="center">
                            <div className="text-[7px] p-2">{policy.name}</div>
                            <Separator />
                            {[
                              { key: 'action', label: 'as' },
                              {
                                key: 'roles',
                                label: 'to',
                                format: (roles: string[]) => roles.join(', '),
                              },
                              { key: 'command', label: 'for' },
                              { key: 'definition', label: 'using', type: 'code' },
                              { key: 'check', label: 'with check', type: 'code' },
                            ].map(
                              ({
                                key,
                                label,
                                format,
                                type,
                              }: {
                                key: string
                                label: string
                                format?: (value: string[]) => string
                                type?: string
                              }) => {
                                const value = policy[key as keyof typeof policy]
                                if (!value || (Array.isArray(value) && !value.length)) return null

                                return (
                                  <>
                                    <div
                                      key={key}
                                      className={cn('flex items-center gap-2 mt-1 px-2 pb-1')}
                                    >
                                      <span className="font-mono min-w-4">{label}</span>
                                      {type === 'code' ? (
                                        <span className="font-mono break-words leading-snug max-w-24">
                                          {format ? format(value as string[]) : value}
                                        </span>
                                      ) : format ? (
                                        format(value as string[])
                                      ) : (
                                        value
                                      )}
                                    </div>
                                    <Separator />
                                  </>
                                )
                              }
                            )}
                          </PopoverContent_Shadcn_>
                        </Popover_Shadcn_>
                      </div>
                      <Separator />
                    </>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}

export { TABLE_NODE_ROW_HEIGHT, TABLE_NODE_WIDTH, TableNode }
