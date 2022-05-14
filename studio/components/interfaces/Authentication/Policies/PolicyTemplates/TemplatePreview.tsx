import { FC } from 'react'
import { isEmpty } from 'lodash'
import SqlEditor from 'components/ui/SqlEditor'
import { PolicyTemplate } from './PolicyTemplates.constants'

interface Props {
  selectedTemplate: PolicyTemplate
}

const TemplatePreview: FC<Props> = ({ selectedTemplate }) => {
  const { id, templateName, description, statement } = selectedTemplate
  return (
    <div className="space-y-8" style={{ width: '70%' }}>
      {!isEmpty(selectedTemplate) && (
        <div className="flex h-full flex-col justify-between">
          <div className="my-5 h-full space-y-6 px-6">
            <div className="space-y-2">
              <div className="flex flex-col space-y-2">
                <h3 className="text-scale-1200 text-base">{templateName}</h3>
                <p className="text-scale-1100 text-sm">{description}</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-scale-1100 text-sm">Policy SQL template:</label>
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
