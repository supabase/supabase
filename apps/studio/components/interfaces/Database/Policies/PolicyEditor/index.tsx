import { DialogSection, DialogSectionSeparator } from 'ui'

import PolicyAllowedOperation from './PolicyAllowedOperation'
import PolicyDefinition from './PolicyDefinition'
import PolicyEditorFooter from './PolicyEditorFooter'
import { PolicyName } from './PolicyName'
import { PolicyRoles } from './PolicyRoles'

interface PolicyEditorProps {
  isNewPolicy: boolean
  policyFormFields: any
  onUpdatePolicyFormFields: (value: any) => void
  onViewTemplates: () => void
  onReviewPolicy: () => void
}

export const PolicyEditor = ({
  isNewPolicy = true,
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
    <>
      <DialogSection>
        <PolicyName
          name={policyFormFields.name}
          limit={63}
          onUpdatePolicyName={(name) => onUpdatePolicyFormFields({ name })}
        />
      </DialogSection>
      <DialogSectionSeparator />
      {isNewPolicy && (
        <>
          <DialogSection>
            <PolicyAllowedOperation
              operation={operation}
              onSelectOperation={(command) => onUpdatePolicyFormFields({ command })}
            />
          </DialogSection>
          <DialogSectionSeparator />
        </>
      )}
      <DialogSection>
        <PolicyRoles
          selectedRoles={selectedRoles}
          onUpdateSelectedRoles={(roles) => onUpdatePolicyFormFields({ roles })}
        />
      </DialogSection>
      <DialogSectionSeparator />
      <DialogSection>
        <PolicyDefinition
          operation={operation}
          definition={definition}
          check={check}
          onUpdatePolicyUsing={(definition: string | undefined) =>
            onUpdatePolicyFormFields({ definition })
          }
          onUpdatePolicyCheck={(check: string | undefined) => onUpdatePolicyFormFields({ check })}
        />
      </DialogSection>
      <PolicyEditorFooter
        showTemplates={isNewPolicy}
        onViewTemplates={onViewTemplates}
        onReviewPolicy={onReviewPolicy}
      />
    </>
  )
}
