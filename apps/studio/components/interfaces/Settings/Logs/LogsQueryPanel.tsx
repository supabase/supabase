import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import {
  Alert,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconBookOpen,
  IconCheck,
  IconChevronDown,
  IconClipboard,
  IconExternalLink,
  IconX,
  Popover,
  SidePanel,
  Tabs,
} from 'ui'

import { useCheckPermissions, useIsFeatureEnabled } from 'hooks'
import { useProfile } from 'lib/profile'
import Link from 'next/link'
import React, { useState } from 'react'
import {
  EXPLORER_DATEPICKER_HELPERS,
  LogsTableName,
  LogsWarning,
  LOGS_SOURCE_DESCRIPTION,
  LogTemplate,
} from '.'
import DatePickers from './Logs.DatePickers'
import Table from 'components/to-be-cleaned/Table'
import { logConstants } from 'shared-data'
import { copyToClipboard } from 'lib/helpers'

export interface LogsQueryPanelProps {
  templates?: LogTemplate[]
  onSelectTemplate: (template: LogTemplate) => void
  onSelectSource: (source: LogsTableName) => void
  onClear: () => void
  onSave?: () => void
  hasEditorValue: boolean
  isLoading: boolean
  onDateChange: React.ComponentProps<typeof DatePickers>['onChange']
  defaultTo: string
  defaultFrom: string
  warnings: LogsWarning[]
}

const LogsQueryPanel = ({
  templates = [],
  onSelectTemplate,
  onSelectSource,
  defaultFrom,
  defaultTo,
  onDateChange,
  warnings,
}: LogsQueryPanelProps) => {
  const [showReference, setShowReference] = React.useState(false)

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
      return true
    })
    .map(([, value]) => value)

  return (
    <div className="rounded rounded-bl-none rounded-br-none border border-overlay bg-surface-100">
      <div className="flex w-full items-center justify-between px-5 py-2">
        <div className="flex w-full flex-row items-center justify-between gap-x-4">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="default" iconRight={<IconChevronDown />}>
                  <span>Insert source</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start">
                {logsTableNames
                  .sort((a, b) => a.localeCompare(b))
                  .map((source) => (
                    <DropdownMenuItem key={source} onClick={() => onSelectSource(source)}>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono font-bold">{source}</span>
                        <span className="text-foreground-light">
                          {LOGS_SOURCE_DESCRIPTION[source]}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="default" iconRight={<IconChevronDown />}>
                  <span>Templates</span>
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
            <DatePickers
              to={defaultTo}
              from={defaultFrom}
              onChange={onDateChange}
              helpers={EXPLORER_DATEPICKER_HELPERS}
            />
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
                  <Badge color="yellow">
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
                      type="default"
                      onClick={() => setShowReference(true)}
                      icon={<IconBookOpen strokeWidth={1.5} />}
                    >
                      Field Reference
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
