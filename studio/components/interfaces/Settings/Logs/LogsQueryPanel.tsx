import { Button, Dropdown, Typography, IconChevronDown, IconPlay } from '@supabase/ui'
import { LogTemplate } from '.'
interface Props {
  templates?: LogTemplate[]
  onSelectTemplate: (template: LogTemplate) => void
  onRun: () => void
  onClear: () => void
  onSave?: () => void
  hasEditorValue: boolean
}

const LogsQueryPanel: React.FC<Props> = ({
  templates = [],
  onSelectTemplate,
  hasEditorValue,
  onRun,
  onClear,
  onSave,
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
            overlay={templates.map((template: LogTemplate) => (
              <Dropdown.Item key={template.label} onClick={() => onSelectTemplate(template)}>
                <Typography.Text>{template.label}</Typography.Text>
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
                <Button type="default" disabled>
                  Save query
                </Button>
              )}
            </div>

            <Button
              type={hasEditorValue ? 'alternative' : 'default'}
              disabled={!hasEditorValue}
              onClick={onRun}
              icon={<IconPlay />}
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
