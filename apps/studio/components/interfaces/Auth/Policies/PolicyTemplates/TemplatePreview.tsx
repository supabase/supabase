import SqlEditor from 'components/ui/SqlEditor'
import { isEmpty } from 'lodash'
import { PolicyTemplate } from './PolicyTemplates.constants'

interface TemplatePreviewProps {
  selectedTemplate: PolicyTemplate
}

const TemplatePreview = ({ selectedTemplate }: TemplatePreviewProps) => {
  const { id, templateName, description, statement } = selectedTemplate
  return (
    <div className="space-y-8 md:w-[70%]">
      {!isEmpty(selectedTemplate) && (
        <div className="flex h-full flex-col justify-between">
          <div className="my-5 h-full space-y-6 px-6">
            <div className="space-y-2">
              <div className="flex flex-col space-y-2">
                <h3>{templateName}</h3>
                <p className="text-foreground-light text-sm">{description}</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-foreground-light text-sm">Policy SQL template:</label>
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

export default TemplatePreview
