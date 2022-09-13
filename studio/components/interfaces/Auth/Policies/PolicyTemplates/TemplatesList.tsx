import { FC } from 'react'
import { Menu } from '@supabase/ui'
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
  <div className="dark:border-dark flex flex-col justify-between border-r" style={{ width: '30%' }}>
    <div
      className="hide-scrollbar  divide-border-primary space-y-0 divide-y divide-solid overflow-y-auto"
      style={{ maxHeight: '24rem' }}
    >
      <Menu type="border">
        {templates.map((template) => {
          const active = selectedTemplate === template
          return (
            <div
              className={
                'hover:bg-scale-400 border-scale-400 border-b ' +
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
        <p className="text-scale-900 text-xs">{templatesNote}</p>
      </div>
    )}
  </div>
)

export default TemplatesList
