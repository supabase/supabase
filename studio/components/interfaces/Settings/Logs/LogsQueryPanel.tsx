import { Button, Dropdown, Typography, IconChevronDown, IconPlay } from '@supabase/ui'
import Flag from 'components/ui/Flag/Flag'
import { LogsTableName, LOGS_SOURCE_DESCRIPTION, LogTemplate } from '.'
interface Props {
  templates?: LogTemplate[]
  onSelectTemplate: (template: LogTemplate) => void
  onSelectSource: (source: LogsTableName) => void
  onRun: () => void
  onClear: () => void
  onSave?: () => void
  hasEditorValue: boolean
  isLoading: boolean
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
