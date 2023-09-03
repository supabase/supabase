import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Alert, Badge, Button, Dropdown, IconChevronDown, IconPlay, Popover } from 'ui'

import { useCheckPermissions } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { useProfile } from 'lib/profile'
import Link from 'next/link'
import React from 'react'
import {
  EXPLORER_DATEPICKER_HELPERS,
  LOGS_SOURCE_DESCRIPTION,
  LogTemplate,
  LogsTableName,
  LogsWarning,
} from '.'
import DatePickers from './Logs.DatePickers'

export interface LogsQueryPanelProps {
  templates?: LogTemplate[]
  onSelectTemplate: (template: LogTemplate) => void
  onSelectSource: (source: LogsTableName) => void
  onRun: (e: React.MouseEvent<HTMLButtonElement>) => void
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
  hasEditorValue,
  onRun,
  onClear,
  onSave,
  onSelectSource,
  isLoading,
  defaultFrom,
  defaultTo,
  onDateChange,
  warnings,
}: LogsQueryPanelProps) => {
  const { profile } = useProfile()
  const canCreateLogQuery = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'log_sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  return (
    <div className="rounded rounded-bl-none rounded-br-none border border-panel-border-light bg-panel-header-light dark:border-panel-border-dark dark:bg-panel-header-dark">
      <div className="flex w-full items-center justify-between px-5 py-2">
        <div className="flex w-full flex-row items-center justify-between gap-x-4">
          <div className="flex items-center gap-2">
            <Dropdown
              side="bottom"
              align="start"
              overlay={Object.values(LogsTableName)
                .sort((a, b) => a.localeCompare(b))
                .map((source) => (
                  <Dropdown.Item key={source} onClick={() => onSelectSource(source)}>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono font-bold text-scale-1100">{source}</span>
                      <span className="text-scale-1100">{LOGS_SOURCE_DESCRIPTION[source]}</span>
                    </div>
                  </Dropdown.Item>
                ))}
            >
              <Button asChild type="default" iconRight={<IconChevronDown />}>
                <span>Insert source</span>
              </Button>
            </Dropdown>

            <Dropdown
              side="bottom"
              align="start"
              overlay={templates
                .sort((a, b) => a.label!.localeCompare(b.label!))
                .map((template: LogTemplate) => (
                  <Dropdown.Item key={template.label} onClick={() => onSelectTemplate(template)}>
                    <p>{template.label}</p>
                  </Dropdown.Item>
                ))}
            >
              <Button asChild type="default" iconRight={<IconChevronDown />}>
                <span>Templates</span>
              </Button>
            </Dropdown>
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
                <Button type="default" onClick={onClear}>
                  Clear query
                </Button>
                {IS_PLATFORM && onSave && (
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger>
                      <Button
                        type="default"
                        onClick={() => onSave()}
                        disabled={!canCreateLogQuery || !hasEditorValue}
                      >
                        Save query
                      </Button>
                    </Tooltip.Trigger>
                    {!canCreateLogQuery && (
                      <Tooltip.Portal>
                        <Tooltip.Content side="bottom">
                          <Tooltip.Arrow className="radix-tooltip-arrow" />
                          <div
                            className={[
                              'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                              'border border-scale-200',
                            ].join(' ')}
                          >
                            <span className="text-xs text-scale-1200">
                              You need additional permissions to save your query
                            </span>
                          </div>
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    )}
                  </Tooltip.Root>
                )}
              </div>

              <Button
                type={hasEditorValue ? 'primary' : 'alternative'}
                disabled={!hasEditorValue}
                onClick={onRun}
                iconRight={<IconPlay />}
                loading={isLoading}
              >
                Run
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogsQueryPanel
