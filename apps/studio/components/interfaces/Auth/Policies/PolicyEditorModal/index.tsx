import type { PostgresRole } from '@supabase/postgres-meta'
import { isEmpty, noop } from 'lodash'
import { useEffect, useState } from 'react'
import { Modal } from 'ui'

import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useStore } from 'hooks'
import { POLICY_MODAL_VIEWS } from '../Policies.constants'
import {
  PolicyFormField,
  PostgresPolicyCreatePayload,
  PostgresPolicyUpdatePayload,
} from '../Policies.types'
import {
  createPayloadForCreatePolicy,
  createPayloadForUpdatePolicy,
  createSQLPolicy,
} from '../Policies.utils'
import PolicyEditor from '../PolicyEditor'
import PolicyReview from '../PolicyReview'
import PolicySelection from '../PolicySelection'
import PolicyTemplates from '../PolicyTemplates'
import { PolicyTemplate } from '../PolicyTemplates/PolicyTemplates.constants'
import { getGeneralPolicyTemplates } from './PolicyEditorModal.constants'
import PolicyEditorModalTitle from './PolicyEditorModalTitle'

interface PolicyEditorModalProps {
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

const PolicyEditorModal = ({
  visible = false,
  roles = [],
  schema = '',
  table = '',
  selectedPolicyToEdit = {},
  onSelectCancel = noop,
  onCreatePolicy = () => false,
  onUpdatePolicy = () => false,
  onSaveSuccess = noop,
}: PolicyEditorModalProps) => {
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
  const [isDirty, setIsDirty] = useState(false)
  const [isClosingPolicyEditorModal, setIsClosingPolicyEditorModal] = useState(false)
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
    setIsDirty(true)
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
    setIsDirty(false)
  }

  const onSavePolicy = async (
    payload: PostgresPolicyCreatePayload | PostgresPolicyUpdatePayload
  ) => {
    // @ts-ignore
    const hasError = isNewPolicy ? await onCreatePolicy(payload) : await onUpdatePolicy(payload)
    hasError ? onViewEditor() : onSaveSuccess()
  }

  const isClosingPolicyEditor = () => {
    isDirty ? setIsClosingPolicyEditorModal(true) : onSelectCancel()
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
      onCancel={isClosingPolicyEditor}
    >
      <div className="">
        <ConfirmationModal
          visible={isClosingPolicyEditorModal}
          header="Discard changes"
          buttonLabel="Discard"
          onSelectCancel={() => setIsClosingPolicyEditorModal(false)}
          onSelectConfirm={() => {
            onSelectCancel()
            setIsClosingPolicyEditorModal(false)
            setIsDirty(false)
          }}
        >
          <Modal.Content>
            <p className="py-4 text-sm text-foreground-light">
              There are unsaved changes. Are you sure you want to close the editor? Your changes
              will be lost.
            </p>
          </Modal.Content>
        </ConfirmationModal>
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
