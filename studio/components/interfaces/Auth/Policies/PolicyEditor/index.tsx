import type { PostgresRole } from '@supabase/postgres-meta'
import { Modal } from 'ui'

import PolicyAllowedOperation from './PolicyAllowedOperation'
import PolicyDefinition from './PolicyDefinition'
import PolicyEditorFooter from './PolicyEditorFooter'
import PolicyName from './PolicyName'
import PolicyRoles from './PolicyRoles'

// Exposed for StoragePoliciesEditor.js
export { PolicyName, PolicyRoles }

interface PolicyEditorProps {
  isNewPolicy: boolean
  roles: PostgresRole[]
  policyFormFields: any
  onUpdatePolicyFormFields: (value: any) => void
  onViewTemplates: () => void
  onReviewPolicy: () => void
}

const PolicyEditor = ({
  isNewPolicy = true,
  roles = [],
  policyFormFields = {},
  onUpdatePolicyFormFields = () => {},
  onViewTemplates = () => {},
  onReviewPolicy = () => {},
}: PolicyEditorProps) => {
  const operation = policyFormFields?.command ?? ''
  const definition = policyFormFields?.definition ?? ''
  const check = policyFormFields?.check ?? ''

  // Filter out default public role (public if no roles selected)
  const selectedRoles = (policyFormFields?.roles ?? []).filter((role: string) => role !== 'public')

  return (
    <div className="">
      <div className="space-y-8 py-8">
        <Modal.Content>
          <PolicyName
            name={policyFormFields.name}
            limit={63}
            onUpdatePolicyName={(name) => onUpdatePolicyFormFields({ name })}
          />
        </Modal.Content>
        <Modal.Separator />
        {isNewPolicy && (
          <>
            <Modal.Content>
              <PolicyAllowedOperation
                operation={operation}
                onSelectOperation={(command) => onUpdatePolicyFormFields({ command })}
              />
            </Modal.Content>
            <Modal.Separator />
          </>
        )}
        <Modal.Content>
          <PolicyRoles
            roles={roles}
            selectedRoles={selectedRoles}
            onUpdateSelectedRoles={(roles) => onUpdatePolicyFormFields({ roles })}
          />
        </Modal.Content>
        <Modal.Separator />
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
