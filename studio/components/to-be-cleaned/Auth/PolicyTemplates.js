import { Button, Typography, Menu } from '@supabase/ui'
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
      <Menu className="dark:divide-gray-600">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => setSelectedTemplate(template)}
            className="divide-gray-900"
          >
            <Menu.Item
              className="cursor-pointer"
              showActiveBar
              active={selectedTemplate === template}
            >
              <div className="space-y-2 py-2">
                <Typography.Text>{template.templateName}</Typography.Text>
              </div>
            </Menu.Item>
          </div>
        ))}
      </Menu>
    </div>
    {templatesNote && (
      <div className="px-4 py-2">
        <Typography.Text small>{templatesNote}</Typography.Text>
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
                <Typography.Title level={6}>{templateName}</Typography.Title>
                <Typography.Text>{description}</Typography.Text>
              </div>
            </div>
            <div className="space-y-2">
              <Typography.Text>Policy SQL template:</Typography.Text>
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
      <div className="px-6 py-2 w-full flex justify-end items-center space-x-4 border-t dark:border-dark">
        <Typography.Text type="secondary">
          This will override any existing code you've written
        </Typography.Text>
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
