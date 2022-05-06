import { FC } from 'react'
import { Modal } from '@supabase/ui'
import { get } from 'lodash'

import PolicyName from './PolicyName'
import PolicyDefinition from './PolicyDefinition'
import PolicyAllowedOperation from './PolicyAllowedOperation'
import PolicyEditorFooter from './PolicyEditorFooter'

interface Props {
  isNewPolicy: boolean
  policyFormFields: any
  onUpdatePolicyFormFields: (value: any) => void
  onViewTemplates: () => void
  onReviewPolicy: () => void
}

const PolicyEditor: FC<Props> = ({
  isNewPolicy = true,
  policyFormFields = {},
  onUpdatePolicyFormFields = () => {},
  onViewTemplates = () => {},
  onReviewPolicy = () => {},
}) => {
  const operation = get(policyFormFields, ['command'], '')
  const definition = get(policyFormFields, ['definition'], '') || ''
  const check = get(policyFormFields, ['check'], '') || ''

  return (
    <div className="">
      <div className="mb-8 space-y-8 py-8">
        <Modal.Content>
          <PolicyName
            name={policyFormFields.name}
            onUpdatePolicyName={(name) => onUpdatePolicyFormFields({ name })}
          />
        </Modal.Content>
        <Modal.Seperator />
        {isNewPolicy && (
          <>
            <Modal.Content>
              <PolicyAllowedOperation
                operation={operation}
                onSelectOperation={(command) => onUpdatePolicyFormFields({ command })}
              />
            </Modal.Content>
            <Modal.Seperator />
          </>
        )}
        <Modal.Content>
          <PolicyDefinition
            operation={operation}
            definition={definition}
            check={check}
            onUpdatePolicyUsing={(definition: string | null) =>
              onUpdatePolicyFormFields({ definition })
            }
            onUpdatePolicyCheck={(check: string | null) => onUpdatePolicyFormFields({ check })}
          />
        </Modal.Content>
      </div>
      <PolicyEditorFooter
        showTemplates={isNewPolicy}
        onViewTemplates={onViewTemplates}
        onReviewPolicy={onReviewPolicy}
      />
    </div>
  )
}

export default PolicyEditor
