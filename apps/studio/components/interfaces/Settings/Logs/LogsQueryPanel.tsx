import { IS_PLATFORM, useFlag } from 'common'
import { BookOpen, Check, ChevronDown, ChevronsUpDown, Copy, ExternalLink, X } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'
import { logConstants } from 'shared-data'
import {
  Badge,
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Label_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  SidePanel,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import {
  EXPLORER_DATEPICKER_HELPERS,
  LOGS_SOURCE_DESCRIPTION,
  LogsTableName,
} from './Logs.constants'
import { DatePickerValue, LogsDatePicker } from './Logs.DatePickers'
import { LogsWarning, LogTemplate } from './Logs.types'
import Table from '@/components/to-be-cleaned/Table'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from '@/lib/constants'

export interface LogsQueryPanelProps {
  templates?: LogTemplate[]
  value: DatePickerValue
  warnings: LogsWarning[]
  onSelectTemplate: (template: LogTemplate) => void
  onSelectSource: (source: string) => void
  onDateChange: (value: DatePickerValue) => void
  useOtel?: boolean
  onUseOtelChange?: (value: boolean) => void
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
  value,
  warnings,
  onSelectTemplate,
  onSelectSource,
  onDateChange,
  useOtel = false,
  onUseOtelChange,
}: LogsQueryPanelProps) => {
  const [showReference, setShowReference] = useState(false)
  const { logsTemplates } = useIsFeatureEnabled(['logs:templates'])
  const showChToggleInLogExplorer = useFlag('showChToggleInLogExplorer')
  const otelToggleEnabled = !!showChToggleInLogExplorer && !!onUseOtelChange

  const {
    projectAuthAll: authEnabled,
    projectStorageAll: storageEnabled,
    projectEdgeFunctionAll: edgeFunctionsEnabled,
  } = useIsFeatureEnabled(['project_auth:all', 'project_storage:all', 'project_edge_function:all'])

  const logsTableNames = Object.entries(LogsTableName)
    .filter(([key]) => {
      if (key === 'AUTH') return authEnabled
      if (key === 'STORAGE') return storageEnabled
      if (key === 'FN_EDGE') return edgeFunctionsEnabled
      if (key === 'PG_CRON') return false
      return true
    })
    .map(([, value]) => value)

  const [selectedDatePickerValue, setSelectedDatePickerValue] = useState<DatePickerValue>(value)

  useEffect(() => {
    setSelectedDatePickerValue(value)
  }, [value.from, value.to, value.text, value.isHelper])

  const [open, setOpen] = useState(false)
  const [selectedSchema, setSelectedSchema] = useState(logConstants.schemas[0])

  return (
    <div className="flex items-center border-b bg-surface-100 h-(--header-height)">
      <div className="flex w-full items-center justify-between px-4 md:px-5 py-2 overflow-x-scroll no-scrollbar">
        <div className="flex w-full flex-row items-center justify-between gap-x-4">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="default" iconRight={<ChevronDown />}>
                  Insert source
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="bottom"
                align="start"
                className="max-h-[390px] overflow-auto"
              >
                {logsTableNames
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

            {IS_PLATFORM && logsTemplates && (
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

            <LogsDatePicker
              value={selectedDatePickerValue}
              onSubmit={(value) => {
                setSelectedDatePickerValue(value)
                onDateChange(value)
              }}
              helpers={EXPLORER_DATEPICKER_HELPERS}
            />

            {otelToggleEnabled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="logs-explorer-otel-toggle"
                      checked={useOtel}
                      onCheckedChange={(checked) => onUseOtelChange?.(checked)}
                    />
                    <Label_Shadcn_
                      htmlFor="logs-explorer-otel-toggle"
                      className="text-xs text-foreground-light cursor-pointer"
                    >
                      OTEL endpoint
                    </Label_Shadcn_>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  Run this query against the new ClickHouse-backed OTEL endpoint instead of
                  BigQuery. Use to validate ClickHouse SQL before relying on it.
                </TooltipContent>
              </Tooltip>
            )}

            <div
              data-testid="log-explorer-warnings"
              className={`transition-all duration-300 h-full ${
                warnings.length > 0 ? 'opacity-100' : 'invisible h-0 w-0 opacity-0'
              }`}
            >
              <Tooltip>
                <TooltipTrigger className="flex items-start">
                  <Badge variant="warning">
                    {warnings.length} {warnings.length > 1 ? 'warnings' : 'warning'}
                  </Badge>
                  <TooltipContent className="p-0 divide-y max-w-xs" side="bottom">
                    {warnings.map((warning, index) => (
                      <p
                        key={index}
                        className="px-3 py-1.5 text-xs text-foreground-light text-left"
                      >
                        {warning.text}{' '}
                        {warning.link && (
                          <Link href={warning.link}>{warning.linkText || 'View'}</Link>
                        )}
                      </p>
                    ))}
                  </TooltipContent>
                </TooltipTrigger>
              </Tooltip>
            </div>
          </div>

          <SidePanel
            size="large"
            header={
              <div className="flex flex-row justify-between items-center">
                <h3>Field Reference</h3>
                <Button
                  type="text"
                  className="px-1"
                  onClick={() => setShowReference(false)}
                  icon={<X />}
                />
              </div>
            }
            visible={showReference}
            cancelText="Close"
            onCancel={() => setShowReference(false)}
            hideFooter
            triggerElement={
              <Button
                type="text"
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
                  The following table shows all the available paths that can be queried from each
                  respective source. Do note that to access nested keys, you would need to perform
                  the necessary{' '}
                  <Link
                    href={`${DOCS_URL}/guides/platform/logs#unnesting-arrays`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand"
                  >
                    unnesting joins
                    <ExternalLink
                      size="14"
                      className="ml-1 inline translate-y-[-2px]"
                      strokeWidth={1.5}
                    />
                  </Link>
                </p>
              </div>
            </SidePanel.Content>
            <SidePanel.Separator />

            <div className="px-4 pb-4 flex flex-col gap-4">
              <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
                <PopoverTrigger_Shadcn_ asChild>
                  <Button
                    type="default"
                    role="combobox"
                    size={'small'}
                    aria-expanded={open}
                    className="w-full justify-between"
                    iconRight={<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                  >
                    {value ? selectedSchema?.name : 'Select source...'}
                  </Button>
                </PopoverTrigger_Shadcn_>
                <PopoverContent_Shadcn_ className="p-0" sameWidthAsTrigger>
                  <Command_Shadcn_>
                    <CommandInput_Shadcn_ placeholder="Search source..." />
                    <CommandList_Shadcn_>
                      <CommandEmpty_Shadcn_>No source found.</CommandEmpty_Shadcn_>
                      <CommandGroup_Shadcn_>
                        {logConstants.schemas.map((schema) => (
                          <CommandItem_Shadcn_
                            key={schema.reference}
                            value={schema.reference}
                            onSelect={() => {
                              setSelectedSchema(schema)
                              setOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedSchema === schema ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {schema.name}
                          </CommandItem_Shadcn_>
                        ))}
                      </CommandGroup_Shadcn_>
                    </CommandList_Shadcn_>
                  </Command_Shadcn_>
                </PopoverContent_Shadcn_>
              </Popover_Shadcn_>
              <Table
                head={[
                  <Table.th className="text-xs p-2!" key="path">
                    Path
                  </Table.th>,
                  <Table.th key="type" className="text-xs p-2!">
                    Type
                  </Table.th>,
                ]}
                body={selectedSchema.fields.map((field) => (
                  <Field key={field.path} field={field} />
                ))}
              />
            </div>
          </SidePanel>
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
        className="font-mono text-xs p-2! cursor-pointer hover:text-foreground transition flex items-center space-x-2"
        onClick={() =>
          copyToClipboard(field.path, () => {
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 3000)
          })
        }
      >
        <span>{field.path}</span>
        {isCopied ? (
          <Tooltip>
            <TooltipTrigger>
              <Check size={14} strokeWidth={3} className="text-brand" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Copied</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger>
              <Copy size={14} strokeWidth={1.5} />
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy value</TooltipContent>
          </Tooltip>
        )}
      </Table.td>
      <Table.td className="font-mono text-xs p-2!">{field.type}</Table.td>
    </Table.tr>
  )
}

export default LogsQueryPanel
