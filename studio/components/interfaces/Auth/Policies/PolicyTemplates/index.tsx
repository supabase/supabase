import { Button } from 'ui'
import { FC, useState } from 'react'
import { isEmpty } from 'lodash'

import TemplatesList from './TemplatesList'
import TemplatePreview from './TemplatePreview'
import { PolicyTemplate } from './PolicyTemplates.constants'

interface Props {
  templates: PolicyTemplate[]
  templatesNote: string
  onUseTemplate: (template: PolicyTemplate) => void
}

const PolicyTemplates: FC<Props> = ({
  templates = [],
  templatesNote = '',
  onUseTemplate = () => {},
}) => {
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
      <div className="flex w-full items-center justify-end gap-3 border-t px-6 py-4 dark:border-dark">
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
