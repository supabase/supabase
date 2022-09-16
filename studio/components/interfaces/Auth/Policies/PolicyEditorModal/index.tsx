import { Modal } from '@supabase/ui'
import { FC, useState, useEffect } from 'react'
import { isEmpty } from 'lodash'
import { PostgresRole } from '@supabase/postgres-meta'

import { useStore } from 'hooks'
import PolicyEditorModalTitle from './PolicyEditorModalTitle'
import { getGeneralPolicyTemplates } from './PolicyEditorModal.constants'

import PolicyEditor from '../PolicyEditor'
import PolicyReview from '../PolicyReview'
import PolicyTemplates from '../PolicyTemplates'
import PolicySelection from '../PolicySelection'
import {
  createSQLPolicy,
  createPayloadForCreatePolicy,
  createPayloadForUpdatePolicy,
} from '../Policies.utils'
import { POLICY_MODAL_VIEWS } from '../Policies.constants'
import {
  PolicyFormField,
  PostgresPolicyCreatePayload,
  PostgresPolicyUpdatePayload,
} from '../Policies.types'
import { PolicyTemplate } from '../PolicyTemplates/PolicyTemplates.constants'

interface Props {
  visible: boolean
  roles?: PostgresRole[]
  schema: string
  table: string
  selectedPolicyToEdit: any
  onSelectCancel: () => void
  onCreatePolicy: (payload: PostgresPolicyCreatePayload) => boolean
  onUpdatePolicy: (payload: PostgresPolicyUpdatePayload) => boolean
  onSaveSuccess: () => void
}

const PolicyEditorModal: FC<Props> = ({
  visible = false,
  roles = [],
  schema = '',
  table = '',
  selectedPolicyToEdit = {},
  onSelectCancel = () => {},
  onCreatePolicy = () => {},
  onUpdatePolicy = () => {},
  onSaveSuccess = () => {},
}) => {
  const { ui } = useStore()

  const newPolicyTemplate: PolicyFormField = {
    schema,
    table,
    name: '',
    definition: '',
    check: '',
    command: null,
    roles: [],
  }

  const isNewPolicy = isEmpty(selectedPolicyToEdit)
  const initializedPolicyFormFields = isNewPolicy ? newPolicyTemplate : selectedPolicyToEdit

  // Mainly to decide which view to show when back from templates
  const [previousView, setPreviousView] = useState('')
  const [view, setView] = useState(POLICY_MODAL_VIEWS.EDITOR)

  const [policyFormFields, setPolicyFormFields] = useState<PolicyFormField>(
    initializedPolicyFormFields
  )
  const [policyStatementForReview, setPolicyStatementForReview] = useState<any>('')

  useEffect(() => {
    if (visible) {
      if (isNewPolicy) {
        onViewIntro()
      } else {
        onViewEditor()
      }
      setPolicyFormFields(initializedPolicyFormFields)
    }
  }, [visible])

  /* Methods that are for the UI */

  const onViewIntro = () => setView(POLICY_MODAL_VIEWS.SELECTION)
  const onViewEditor = () => setView(POLICY_MODAL_VIEWS.EDITOR)
  const onViewTemplates = () => {
    setPreviousView(view)
    setView(POLICY_MODAL_VIEWS.TEMPLATES)
  }
  const onReviewPolicy = () => setView(POLICY_MODAL_VIEWS.REVIEW)
  const onSelectBackFromTemplates = () => setView(previousView)

  const onUseTemplate = (template: PolicyTemplate) => {
    setPolicyFormFields({
      ...policyFormFields,
      name: template.name,
      definition: template.definition,
      check: template.check,
      command: template.command,
      roles: template.roles,
    })
    onViewEditor()
  }

  const onUpdatePolicyFormFields = (field: Partial<PolicyFormField>) => {
    if (field.name && field.name.length > 63) return
    setPolicyFormFields({ ...policyFormFields, ...field })
  }

  const validatePolicyFormFields = () => {
    const { name, definition, check, command } = policyFormFields

    if (name.length === 0) {
      return ui.setNotification({ category: 'error', message: 'Do give your policy a name' })
    }
    if (!command) {
      return ui.setNotification({
        category: 'error',
        message: 'You will need to allow at one operation in your policy',
        duration: 4000,
      })
    }
    if (['SELECT', 'DELETE'].includes(command) && !definition) {
      return ui.setNotification({
        category: 'error',
        message: 'Did you forget to provide a USING expression for your policy?',
        duration: 4000,
      })
    }
    if (command === 'INSERT' && !check) {
      return ui.setNotification({
        category: 'error',
        message: 'Did you forget to provide a WITH CHECK expression for your policy?',
        duration: 4000,
      })
    }
    if (command === 'UPDATE' && !definition && !check) {
      return ui.setNotification({
        category: 'error',
        message:
          'You will need to provide either a USING, or WITH CHECK expression, or both for your policy',
        duration: 4000,
      })
    }
    const policySQLStatement = createSQLPolicy(policyFormFields, selectedPolicyToEdit)
    setPolicyStatementForReview(policySQLStatement)
    onReviewPolicy()
  }

  const onReviewSave = () => {
    const payload = isNewPolicy
      ? createPayloadForCreatePolicy(policyFormFields)
      : createPayloadForUpdatePolicy(policyFormFields, selectedPolicyToEdit)
    onSavePolicy(payload)
  }

  const onSavePolicy = async (
    payload: PostgresPolicyCreatePayload | PostgresPolicyUpdatePayload
  ) => {
    // @ts-ignore
    const hasError = isNewPolicy ? await onCreatePolicy(payload) : await onUpdatePolicy(payload)
    hasError ? onViewEditor() : onSaveSuccess()
  }

  return (
    <Modal
      size={view === POLICY_MODAL_VIEWS.SELECTION ? 'medium' : 'xxlarge'}
      closable
      hideFooter
      visible={visible}
      contentStyle={{ padding: 0 }}
      header={[
        <PolicyEditorModalTitle
          key="0"
          view={view}
          isNewPolicy={isNewPolicy}
          schema={schema}
          table={table}
          onSelectBackFromTemplates={onSelectBackFromTemplates}
        />,
      ]}
      onCancel={onSelectCancel}
      onInteractOutside={(event) => {
        const isToast = (event.target as Element)?.closest('#toast')
        if (isToast) {
          event.preventDefault()
        }
      }}
    >
      <div className="">
        {view === POLICY_MODAL_VIEWS.SELECTION ? (
          <PolicySelection
            description="Write rules with PostgreSQL's policies to fit your unique business needs."
            onViewTemplates={onViewTemplates}
            onViewEditor={onViewEditor}
          />
        ) : view === POLICY_MODAL_VIEWS.EDITOR ? (
          <PolicyEditor
            isNewPolicy={isNewPolicy}
            roles={roles}
            policyFormFields={policyFormFields}
            onUpdatePolicyFormFields={onUpdatePolicyFormFields}
            onViewTemplates={onViewTemplates}
            onReviewPolicy={validatePolicyFormFields}
          />
        ) : view === POLICY_MODAL_VIEWS.TEMPLATES ? (
          <PolicyTemplates
            templates={getGeneralPolicyTemplates(schema, table)}
            templatesNote="* References a specific column in the table"
            onUseTemplate={onUseTemplate}
          />
        ) : view === POLICY_MODAL_VIEWS.REVIEW ? (
          <PolicyReview
            policy={policyStatementForReview}
            onSelectBack={onViewEditor}
            onSelectSave={onReviewSave}
          />
        ) : (
          <div />
        )}
      </div>
    </Modal>
  )
}

export default PolicyEditorModal
