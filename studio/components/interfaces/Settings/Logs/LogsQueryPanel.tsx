import {
  Button,
  Dropdown,
  Typography,
  IconChevronDown,
  IconPlay,
  Badge,
  Popover,
  Alert,
} from '@supabase/ui'
import Flag from 'components/ui/Flag/Flag'
import {
  EXPLORER_DATEPICKER_HELPERS,
  LogsTableName,
  LogsWarning,
  LOGS_SOURCE_DESCRIPTION,
  LogTemplate,
} from '.'
import DatePickers from './Logs.DatePickers'
import Link from 'next/link'
import React from 'react'

interface Props {
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

const LogsQueryPanel: React.FC<Props> = ({
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
}) => (
  <div
    className="
border
border-panel-border-light dark:border-panel-border-dark rounded rounded-bl-none rounded-br-none
bg-panel-header-light dark:bg-panel-header-dark

"
  >
    <div className="px-5 py-2 flex items-center justify-between w-full">
      <div className="flex flex-row gap-x-4 items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Dropdown
            side="bottom"
            align="start"
            overlay={Object.values(LogsTableName).map((source) => (
              <Dropdown.Item key={source} onClick={() => onSelectSource(source)}>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-white font-bold">{source}</span>
                  <span className="text-scale-1100">{LOGS_SOURCE_DESCRIPTION[source]}</span>
                </div>
              </Dropdown.Item>
            ))}
          >
            <Button as="span" type="default" iconRight={<IconChevronDown />}>
              Insert source
            </Button>
          </Dropdown>

          <Dropdown
            side="bottom"
            align="start"
            overlay={templates.map((template: LogTemplate) => (
              <Dropdown.Item key={template.label} onClick={() => onSelectTemplate(template)}>
                <Typography.Text>{template.label}</Typography.Text>
              </Dropdown.Item>
            ))}
          >
            <Button as="span" type="default" iconRight={<IconChevronDown />}>
              Templates
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
                warnings.length > 0 ? 'opacity-100' : 'invisible w-0 h-0 opacity-0'
              }`}
            >
              <Popover
                portalled
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
              {onSave && (
                <Flag name="logsSavedQueries">
                  <Button type="default" onClick={() => onSave()} disabled={!hasEditorValue}>
                    Save query
                  </Button>
                </Flag>
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

export default LogsQueryPanel
