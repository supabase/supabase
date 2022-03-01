import { Button, Menu } from '@supabase/ui'
import { useState } from 'react'
import { isEmpty } from 'lodash'
import SqlEditor from '../SqlEditor'

const TemplatesList = ({
  templates = [],
  templatesNote = '',
  selectedTemplate = {},
  setSelectedTemplate = () => {},
}) => (
  <div className="border-r dark:border-dark flex flex-col justify-between" style={{ width: '30%' }}>
    <div
      className="space-y-0  overflow-y-auto hide-scrollbar divide-y divide-solid divide-border-primary"
      style={{ maxHeight: '24rem' }}
    >
      <Menu type="border">
        {templates.map((template) => {
          const active = selectedTemplate === template
          return (
            <div
              className={
                'hover:bg-scale-400 border-b border-scale-400 ' +
                (active ? 'bg-scale-300 dark:bg-scale-500' : '')
              }
            >
              <Menu.Item
                key={template.id}
                active={active}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="py-2 truncate">{template.templateName}</div>
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

const TemplatePreview = ({ selectedTemplate = {} }) => {
  const { id, templateName, description, statement } = selectedTemplate
  return (
    <div className="space-y-8" style={{ width: '70%' }}>
      {!isEmpty(selectedTemplate) && (
        <div className="flex flex-col justify-between h-full">
          <div className="px-6 my-5 space-y-6 h-full">
            <div className="space-y-2">
              <div className="flex flex-col space-y-2">
                <h3 className="text-base text-scale-1200">{templateName}</h3>
                <p className="text-sm text-scale-1100">{description}</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-scale-1100">Policy SQL template:</label>
              <div className="h-64">
                <SqlEditor readOnly queryId={id} defaultValue={statement} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const PolicyTemplates = ({ templates = [], templatesNote = '', onUseTemplate = () => {} }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0])
  return (
    <div>
      <div className="flex justify-between border-t dark:border-dark">
        <TemplatesList
          templatesNote={templatesNote}
          templates={templates}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
        />
        <TemplatePreview selectedTemplate={selectedTemplate} />
      </div>
      <div className="px-6 py-4 w-full flex justify-end items-center gap-3 border-t dark:border-dark">
        <span className="text-sm text-scale-900">
          This will override any existing code you've written
        </span>
        <Button
          type="primary"
          disabled={isEmpty(selectedTemplate)}
          onClick={() => onUseTemplate(selectedTemplate)}
        >
          Use this template
        </Button>
      </div>
    </div>
  )
}

export default PolicyTemplates
