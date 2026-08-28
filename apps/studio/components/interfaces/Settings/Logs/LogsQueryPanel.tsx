import { useFlag, useParams } from 'common'
import { BookOpen, Check, ChevronDown, ChevronsUpDown, Copy, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'
import { logConstants } from 'shared-data'
import {
  Badge,
  Button,
  Card,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetSection,
  SheetTitle,
  SheetTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  EXPLORER_DATEPICKER_HELPERS,
  LOGS_SOURCE_DESCRIPTION,
  LogsTableName,
} from './Logs.constants'
import { DatePickerValue, LogsDatePicker } from './Logs.DatePickers'
import { otelFieldsFromKeys, toOtelFieldSchemas } from './Logs.fieldReference'
import { LogsWarning, LogTemplate } from './Logs.types'
import { useOtelLogKeysQuery } from '@/data/logs/otel-log-keys-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useShowMultigresLogs } from '@/hooks/misc/useShowMultigresLogs'
import { DOCS_URL } from '@/lib/constants'

interface LogsQueryPanelProps {
  templates?: LogTemplate[]
  value: DatePickerValue
  warnings: LogsWarning[]
  onSelectTemplate: (template: LogTemplate) => void
  onSelectSource: (source: string) => void
  onDateChange: (value: DatePickerValue) => void
  showRewriteAction?: boolean
  isRewriting?: boolean
  onRewrite?: () => void
}

function DropdownMenuItemContent({ name, desc }: { name: ReactNode; desc?: string }) {
  return (
    <div className="grid gap-1">
      <div className="font-mono font-bold">{name}</div>
      {desc && <div className="text-foreground-light">{desc}</div>}
    </div>
  )
}

export const LogsQueryPanel = ({
  templates = [],
  value,
  warnings,
  onSelectTemplate,
  onSelectSource,
  onDateChange,
  showRewriteAction = false,
  isRewriting = false,
  onRewrite,
}: LogsQueryPanelProps) => {
  const [showReference, setShowReference] = useState(false)
  const { logsTemplates } = useIsFeatureEnabled(['logs:templates'])

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

  const showMultigresLogs = useShowMultigresLogs()
  const useOtel = useFlag('otelLegacyLogs')
  const baseSchemas = logConstants.schemas.filter(
    (schema) => schema.reference !== 'multigres_logs' || showMultigresLogs
  )
  const schemas = useOtel ? toOtelFieldSchemas(baseSchemas) : baseSchemas

  const [selectedRef, setSelectedRef] = useState(schemas[0]?.reference)
  const selectedSchema = schemas.find((s) => s.reference === selectedRef) ?? schemas[0]

  const { ref: projectRef } = useParams()
  const { data: discoveredKeys, isPending: isLoadingKeys } = useOtelLogKeysQuery(
    { projectRef, source: selectedRef },
    { enabled: useOtel && showReference }
  )

  return (
    <div className="flex items-center border-b bg-surface-100 h-(--header-height)">
      <div className="flex w-full items-center justify-between px-4 md:px-5 py-2 overflow-x-scroll no-scrollbar">
        <div className="flex w-full flex-row items-center justify-between gap-x-4">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" iconRight={<ChevronDown />}>
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

            {logsTemplates && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" iconRight={<ChevronDown />}>
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

          <div className="flex items-center gap-1">
            {showRewriteAction && onRewrite && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    loading={isRewriting}
                    onClick={onRewrite}
                    className="px-2"
                  >
                    Rewrite query to ClickHouse SQL
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="w-72 text-center">
                  Logs now run on a ClickHouse-backed engine. Click to rewrite this query with the
                  Assistant.
                </TooltipContent>
              </Tooltip>
            )}

            <Sheet open={showReference} onOpenChange={setShowReference}>
              <SheetTrigger asChild>
                <Button variant="text" icon={<BookOpen />} className="px-2">
                  <span>Field Reference</span>
                </Button>
              </SheetTrigger>
              <SheetContent size="lg" className="flex w-full flex-col gap-0 p-0">
                <SheetHeader>
                  <SheetTitle>Field Reference</SheetTitle>
                  {useOtel ? (
                    <SheetDescription>
                      The following table shows the fields available on each source. Nested fields
                      live in the{' '}
                      <code className="text-code-inline text-xs !break-keep">log_attributes</code>{' '}
                      map and are read with{' '}
                      <code className="text-code-inline text-xs !break-keep">
                        log_attributes['key']
                      </code>{' '}
                      — no unnesting joins needed.
                    </SheetDescription>
                  ) : (
                    <SheetDescription>
                      The following table shows all the available paths that can be queried from
                      each respective source. Do note that to access nested keys, you would need to
                      perform the necessary{' '}
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
                    </SheetDescription>
                  )}
                </SheetHeader>

                <SheetSection className="flex flex-col gap-y-4 overflow-y-auto ">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="default"
                        role="combobox"
                        size={'small'}
                        aria-expanded={open}
                        className="w-full justify-between"
                        iconRight={<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                      >
                        {value ? selectedSchema?.name : 'Select source...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" sameWidthAsTrigger>
                      <Command>
                        <CommandInput placeholder="Search source..." />
                        <CommandList>
                          <CommandEmpty>No source found.</CommandEmpty>
                          <CommandGroup>
                            {schemas.map((schema) => (
                              <CommandItem
                                key={schema.reference}
                                value={schema.reference}
                                onSelect={() => {
                                  setSelectedRef(schema.reference)
                                  setOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    selectedSchema?.reference === schema.reference
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {schema.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <Card className="overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs p-2!">Path</TableHead>
                          <TableHead className="text-xs p-2!">Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {useOtel && isLoadingKeys
                          ? Array.from({ length: 3 }).map((_, i) => (
                              <TableRow key={i}>
                                <TableCell colSpan={2} className="p-2">
                                  <ShimmeringLoader />
                                </TableCell>
                              </TableRow>
                            ))
                          : (useOtel
                              ? otelFieldsFromKeys(discoveredKeys ?? [])
                              : selectedSchema.fields
                            ).map((field) => <Field key={field.path} field={field} />)}
                      </TableBody>
                    </Table>
                  </Card>
                </SheetSection>
              </SheetContent>
            </Sheet>
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
    <TableRow>
      <TableCell
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
      </TableCell>
      <TableCell className="font-mono text-xs p-2!">{field.type}</TableCell>
    </TableRow>
  )
}
