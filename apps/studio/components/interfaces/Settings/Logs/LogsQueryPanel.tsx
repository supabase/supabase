import Link from 'next/link'
import React, { ReactNode, useState } from 'react'

import * as Tooltip from '@radix-ui/react-tooltip'
import {
  Alert,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconCheck,
  IconChevronDown,
  IconClipboard,
  IconExternalLink,
  IconX,
  Popover,
  SidePanel,
  Tabs,
} from 'ui'
import DatePickers from './Logs.DatePickers'
import Table from 'components/to-be-cleaned/Table'
import { logConstants } from 'shared-data'
import { copyToClipboard } from 'lib/helpers'
import { BookOpen, ChevronDown } from 'lucide-react'
import { WarehouseQueryTemplate } from './Warehouse.utils'
import {
  EXPLORER_DATEPICKER_HELPERS,
  LOGS_SOURCE_DESCRIPTION,
  LogsTableName,
} from './Logs.constants'
import { LogTemplate, LogsWarning, WarehouseCollection } from './Logs.types'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useFlag } from 'hooks/ui/useFlag'
import { IS_PLATFORM } from 'common'

export type SourceType = 'logs' | 'warehouse'
export interface LogsQueryPanelProps {
  templates?: LogTemplate[]
  warehouseTemplates?: WarehouseQueryTemplate[]
  onSelectTemplate: (template: LogTemplate) => void
  onSelectWarehouseTemplate: (template: WarehouseQueryTemplate) => void
  onSelectSource: (source: string) => void
  onClear: () => void
  onSave?: () => void
  hasEditorValue: boolean
  isLoading: boolean
  onDateChange: React.ComponentProps<typeof DatePickers>['onChange']
  defaultTo: string
  defaultFrom: string
  warnings: LogsWarning[]
  warehouseCollections: WarehouseCollection[]
  dataSource: SourceType
  onDataSourceChange: (sourceType: SourceType) => void
}

function DropdownMenuItemContent({ name, desc }: { name: ReactNode; desc?: string }) {
  return (
    <div className="grid gap-1">
      <div className="font-mono font-bold">{name}</div>
      {desc && <div className="text-foreground-light">{desc}</div>}
    </div>
  )
}

const LogsQueryPanel = ({
  templates = [],
  warehouseTemplates = [],
  onSelectTemplate,
  onSelectWarehouseTemplate,
  onSelectSource,
  defaultFrom,
  defaultTo,
  onDateChange,
  warnings,
  warehouseCollections,
  dataSource,
  onDataSourceChange,
}: LogsQueryPanelProps) => {
  const [showReference, setShowReference] = useState(false)

  const {
    projectAuthAll: authEnabled,
    projectStorageAll: storageEnabled,
    projectEdgeFunctionAll: edgeFunctionsEnabled,
  } = useIsFeatureEnabled(['project_auth:all', 'project_storage:all', 'project_edge_function:all'])

  const warehouseEnabled = useFlag('warehouse')

  const logsTableNames = Object.entries(LogsTableName)
    .filter(([key]) => {
      if (key === 'AUTH') return authEnabled
      if (key === 'STORAGE') return storageEnabled
      if (key === 'FN_EDGE') return edgeFunctionsEnabled
      if (key === 'WAREHOUSE') return false
      return true
    })
    .map(([, value]) => value)

  return (
    <div className="border-b bg-surface-100">
      <div className="flex w-full items-center justify-between px-5 py-2">
        <div className="flex w-full flex-row items-center justify-between gap-x-4">
          <div className="flex items-center gap-2">
            {warehouseEnabled && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="default" iconRight={<ChevronDown />}>
                    Data source <span className="ml-2 font-mono opacity-50">{dataSource}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="start">
                  <DropdownMenuItem onClick={() => onDataSourceChange('logs')}>
                    <DropdownMenuItemContent name="Logs" desc="Logs for all Supabase products" />
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDataSourceChange('warehouse')}>
                    <DropdownMenuItemContent
                      name={
                        <span>
                          Warehouse <Badge variant="warning">NEW</Badge>
                        </span>
                      }
                      desc="Query your data warehouse collections"
                    />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {dataSource === 'warehouse' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="default" iconRight={<ChevronDown />}>
                    Templates
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-96 overflow-auto" side="bottom" align="start">
                  {warehouseTemplates.map((template) => (
                    <DropdownMenuItem
                      key={template.name}
                      onClick={() => onSelectWarehouseTemplate(template)}
                    >
                      <DropdownMenuItemContent name={template.name} desc={template.description} />
                    </DropdownMenuItem>
                  ))}
                  {warehouseCollections.length === 0 && (
                    <DropdownMenuItem className="hover:bg-transparent cursor-default">
                      <DropdownMenuItemContent
                        name="No collections found"
                        desc="You can create collections in the left sidebar."
                      />
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {dataSource === 'logs' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="default" iconRight={<ChevronDown />}>
                    Insert source
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="start"
                  className="max-h-[70vh] overflow-auto"
                >
                  {dataSource === 'logs' &&
                    logsTableNames
                      .sort((a, b) => a.localeCompare(b))
                      .map((source) => (
                        <DropdownMenuItem key={source} onClick={() => onSelectSource(source)}>
                          <DropdownMenuItemContent
                            name={source}
                            desc={LOGS_SOURCE_DESCRIPTION[source]}
                          />
                        </DropdownMenuItem>
                      ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {dataSource === 'logs' && IS_PLATFORM && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="default" iconRight={<ChevronDown />}>
                    Templates
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="start">
                  {templates
                    .sort((a, b) => a.label!.localeCompare(b.label!))
                    .map((template) => (
                      <DropdownMenuItem
                        key={template.label}
                        onClick={() => onSelectTemplate(template)}
                      >
                        <p>{template.label}</p>
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {dataSource === 'logs' && (
              <DatePickers
                to={defaultTo}
                from={defaultFrom}
                onChange={onDateChange}
                helpers={EXPLORER_DATEPICKER_HELPERS}
              />
            )}

            <div className="overflow-hidden">
              <div
                className={` transition-all duration-300 ${
                  warnings.length > 0 ? 'opacity-100' : 'invisible h-0 w-0 opacity-0'
                }`}
              >
                <Popover
                  overlay={
                    <Alert variant="warning" title="">
                      <div className="flex flex-col gap-3">
                        {warnings.map((warning, index) => (
                          <p key={index}>
                            {warning.text}{' '}
                            {warning.link && (
                              <Link href={warning.link}>{warning.linkText || 'View'}</Link>
                            )}
                          </p>
                        ))}
                      </div>
                    </Alert>
                  }
                >
                  <Badge variant="warning">
                    {warnings.length} {warnings.length > 1 ? 'warnings' : 'warning'}
                  </Badge>
                </Popover>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <SidePanel
                  size="large"
                  header={
                    <div className="flex flex-row justify-between items-center">
                      <h3>Field Reference</h3>
                      <Button
                        type="text"
                        className="px-1"
                        onClick={() => setShowReference(false)}
                        icon={<IconX size={18} strokeWidth={1.5} />}
                      />
                    </div>
                  }
                  visible={showReference}
                  cancelText="Close"
                  onCancel={() => setShowReference(false)}
                  hideFooter
                  triggerElement={
                    <Button
                      asChild // ?: we don't want a button inside a button
                      type="default"
                      onClick={() => setShowReference(true)}
                      icon={<BookOpen />}
                      className="px-2"
                    >
                      <span>Field Reference</span>
                    </Button>
                  }
                >
                  <SidePanel.Content>
                    <div className="pt-4 pb-2 space-y-1">
                      <p className="text-sm">
                        The following table shows all the available paths that can be queried from
                        each respective source. Do note that to access nested keys, you would need
                        to perform the necessary{' '}
                        <Link
                          href="https://supabase.com/docs/guides/platform/logs#unnesting-arrays"
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand"
                        >
                          unnesting joins
                          <IconExternalLink
                            size="tiny"
                            className="ml-1 inline -translate-y-[2px]"
                            strokeWidth={1.5}
                          />
                        </Link>
                      </p>
                    </div>
                  </SidePanel.Content>
                  <SidePanel.Separator />
                  <Tabs
                    scrollable
                    size="small"
                    type="underlined"
                    defaultActiveId="edge_logs"
                    listClassNames="px-2"
                  >
                    {logConstants.schemas.map((schema) => (
                      <Tabs.Panel
                        key={schema.reference}
                        id={schema.reference}
                        label={schema.name}
                        className="px-4 pb-4"
                      >
                        <Table
                          head={[
                            <Table.th className="text-xs !p-2" key="path">
                              Path
                            </Table.th>,
                            <Table.th key="type" className="text-xs !p-2">
                              Type
                            </Table.th>,
                          ]}
                          body={schema.fields
                            .sort((a: any, b: any) => a.path - b.path)
                            .map((field) => (
                              <Field key={field.path} field={field} />
                            ))}
                        />
                      </Tabs.Panel>
                    ))}
                  </Tabs>
                </SidePanel>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Field = ({
  field,
}: {
  field: {
    path: string
    type: string
  }
}) => {
  const [isCopied, setIsCopied] = useState(false)

  return (
    <Table.tr>
      <Table.td
        className="font-mono text-xs !p-2 cursor-pointer hover:text-foreground transition flex items-center space-x-2"
        onClick={() =>
          copyToClipboard(field.path, () => {
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 3000)
          })
        }
      >
        <span>{field.path}</span>
        {isCopied ? (
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger>
              <IconCheck size={14} strokeWidth={3} className="text-brand" />
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-alternative py-1 px-2 leading-none shadow',
                    'border border-background',
                  ].join(' ')}
                >
                  <span className="text-xs text-foreground">Copied</span>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ) : (
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger>
              <IconClipboard size="tiny" strokeWidth={1.5} />
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-alternative py-1 px-2 leading-none shadow',
                    'border border-background',
                  ].join(' ')}
                >
                  <span className="text-xs text-foreground">Copy value</span>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        )}
      </Table.td>
      <Table.td className="font-mono text-xs !p-2">{field.type}</Table.td>
    </Table.tr>
  )
}

export default LogsQueryPanel
