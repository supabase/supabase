import { Button } from '@supabase/ui'
import { FC, useState } from 'react'
import { isEmpty } from 'lodash'

import TemplatesList from './TemplatesList'
import TemplatePreview from './TemplatePreview'
import { PolicyTemplate } from './PolicyTemplates.constants'

interface Props {
  templates: PolicyTemplate[]
  templatesNote: string
  onUseTemplate: (template: PolicyTemplate) => void
  onCancel: () => void
}

const PolicyTemplates: FC<Props> = ({
  templates = [],
  templatesNote = '',
  onUseTemplate = () => {},
  onCancel = () => {},
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0])
  return (
    <div>
      <div className="dark:border-dark flex justify-between border-t">
        <TemplatesList
          templatesNote={templatesNote}
          templates={templates}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
        />
        <TemplatePreview selectedTemplate={selectedTemplate} />
      </div>
      <div className="dark:border-dark flex w-full items-center justify-between border-t px-6 py-4">
        <Button type="default" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-scale-900 text-sm">
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
    </div>
  )
}

export default PolicyTemplates
