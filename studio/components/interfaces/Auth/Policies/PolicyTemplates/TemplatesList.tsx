import { FC } from 'react'
import { Menu } from 'ui'
import { PolicyTemplate } from './PolicyTemplates.constants'

interface Props {
  templates: PolicyTemplate[]
  templatesNote: string
  selectedTemplate: PolicyTemplate
  setSelectedTemplate: (template: PolicyTemplate) => void
}

const TemplatesList: FC<Props> = ({
  templates = [],
  templatesNote = '',
  selectedTemplate,
  setSelectedTemplate = () => {},
}) => (
  <div className="flex flex-col justify-between border-r dark:border-dark" style={{ width: '30%' }}>
    <div
      className="hide-scrollbar  divide-border-primary space-y-0 divide-y divide-solid overflow-y-auto"
      style={{ maxHeight: '24rem' }}
    >
      <Menu type="border">
        {templates.map((template, i) => {
          const active = selectedTemplate === template
          return (
            <div
              key={i}
              className={
                'border-b border-scale-400 hover:bg-scale-400 ' +
                (active ? 'bg-scale-300 dark:bg-scale-500' : '')
              }
            >
              <Menu.Item
                key={template.id}
                active={active}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="truncate py-2">{template.templateName}</div>
              </Menu.Item>
            </div>
          )
        })}
      </Menu>
    </div>
    {templatesNote && (
      <div className="px-4 py-2">
        <p className="text-xs text-scale-900">{templatesNote}</p>
      </div>
    )}
  </div>
)

export default TemplatesList
