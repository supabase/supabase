import { FC } from 'react'
import { Modal } from '@supabase/ui'

import PolicyName from './PolicyName'
import PolicyDefinition from './PolicyDefinition'
import PolicyAllowedOperation from './PolicyAllowedOperation'
import PolicyRoles from './PolicyRoles'
import PolicyEditorFooter from './PolicyEditorFooter'
import { PostgresRole } from '@supabase/postgres-meta'

// Exposed for StoragePoliciesEditor.js
export { PolicyName, PolicyRoles }

interface Props {
  isNewPolicy: boolean
  roles: PostgresRole[]
  policyFormFields: any
  onUpdatePolicyFormFields: (value: any) => void
  onViewTemplates: () => void
  onReviewPolicy: () => void
}

const PolicyEditor: FC<Props> = ({
  isNewPolicy = true,
  roles = [],
  policyFormFields = {},
  onUpdatePolicyFormFields = () => {},
  onViewTemplates = () => {},
  onReviewPolicy = () => {},
}) => {
  const operation = policyFormFields?.command ?? ''
  const definition = policyFormFields?.definition ?? ''
  const check = policyFormFields?.check ?? ''

  // Filter out default public role (public if no roles selected)
  const selectedRoles = (policyFormFields?.roles ?? []).filter((role: string) => role !== 'public')

  return (
    <div className="">
      <div className="max-h-[600px] space-y-8 overflow-y-auto py-8">
        <Modal.Content>
          <PolicyName
            name={policyFormFields.name}
            limit={63}
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
          <PolicyRoles
            roles={roles}
            selectedRoles={selectedRoles}
            onUpdateSelectedRoles={(roles) => onUpdatePolicyFormFields({ roles })}
          />
        </Modal.Content>
        <Modal.Seperator />
        <Modal.Content>
          <PolicyDefinition
            operation={operation}
            definition={definition}
            check={check}
            onUpdatePolicyUsing={(definition: string | undefined) =>
              onUpdatePolicyFormFields({ definition })
            }
            onUpdatePolicyCheck={(check: string | undefined) => onUpdatePolicyFormFields({ check })}
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
