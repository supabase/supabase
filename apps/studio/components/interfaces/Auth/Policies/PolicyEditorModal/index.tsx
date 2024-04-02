import { isEmpty, noop } from 'lodash'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import { Modal } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
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
  schema: string
  table: string
  selectedPolicyToEdit: any
  showAssistantPreview?: boolean
  onSelectCancel: () => void
  onCreatePolicy: (payload: PostgresPolicyCreatePayload) => Promise<boolean>
  onUpdatePolicy: (payload: PostgresPolicyUpdatePayload) => Promise<boolean>
  onSaveSuccess: () => void
}

const PolicyEditorModal = ({
  visible = false,
  schema = '',
  table = '',
  selectedPolicyToEdit = {},
  showAssistantPreview = false,
  onSelectCancel = noop,
  onCreatePolicy,
  onUpdatePolicy,
  onSaveSuccess = noop,
}: PolicyEditorModalProps) => {
  const snap = useAppStateSnapshot()

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

  const onToggleFeaturePreviewModal = () => {
    snap.setSelectedFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_RLS_AI_ASSISTANT)
    snap.setShowFeaturePreviewModal(!snap.showFeaturePreviewModal)
    onSelectCancel()
  }

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
      return toast.error('Please provide a name for your policy')
    }
    if (!command) {
      return toast.error('Please select an operation for your policy')
    }
    if (['SELECT', 'DELETE'].includes(command) && !definition) {
      return toast.error('Please provide a USING expression for your policy')
    }
    if (command === 'INSERT' && !check) {
      return toast.error('Please provide a WITH CHECK expression for your policy')
    }
    if (command === 'UPDATE' && !definition && !check) {
      return toast.error(
        'Please provide either a USING, or WITH CHECK expression, or both for your policy'
      )
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
      hideFooter
      size={view === POLICY_MODAL_VIEWS.SELECTION ? 'medium' : 'xxlarge'}
      visible={visible}
      contentStyle={{ padding: 0 }}
      header={[
        <PolicyEditorModalTitle
          key="0"
          view={view}
          isNewPolicy={isNewPolicy}
          schema={schema}
          table={table}
          showAssistantPreview={showAssistantPreview}
          onSelectBackFromTemplates={onSelectBackFromTemplates}
          onToggleFeaturePreviewModal={onToggleFeaturePreviewModal}
        />,
      ]}
      onCancel={isClosingPolicyEditor}
    >
      <div>
        <ConfirmationModal
          visible={isClosingPolicyEditorModal}
          title="Discard changes"
          confirmLabel="Discard"
          onCancel={() => setIsClosingPolicyEditorModal(false)}
          onConfirm={() => {
            onSelectCancel()
            setIsClosingPolicyEditorModal(false)
            setIsDirty(false)
          }}
        >
          <p className="text-sm text-foreground-light">
            There are unsaved changes. Are you sure you want to close the editor? Your changes will
            be lost.
          </p>
        </ConfirmationModal>
        {view === POLICY_MODAL_VIEWS.SELECTION ? (
          <PolicySelection
            description="Write rules with PostgreSQL's policies to fit your unique business needs."
            onViewTemplates={onViewTemplates}
            onViewEditor={onViewEditor}
            showAssistantPreview={showAssistantPreview}
            onToggleFeaturePreviewModal={onToggleFeaturePreviewModal}
          />
        ) : view === POLICY_MODAL_VIEWS.EDITOR ? (
          <PolicyEditor
            isNewPolicy={isNewPolicy}
            policyFormFields={policyFormFields}
            onUpdatePolicyFormFields={onUpdatePolicyFormFields}
            onViewTemplates={onViewTemplates}
            onReviewPolicy={validatePolicyFormFields}
          />
        ) : view === POLICY_MODAL_VIEWS.TEMPLATES ? (
          <PolicyTemplates
            templates={getGeneralPolicyTemplates(schema, table).filter((policy) => !policy.preview)}
            templatesNote="* References a specific column in the table"
            onUseTemplate={onUseTemplate}
          />
        ) : view === POLICY_MODAL_VIEWS.REVIEW ? (
          <PolicyReview
            policy={policyStatementForReview}
            onSelectBack={onViewEditor}
            onSelectSave={onReviewSave}
          />
        ) : null}
      </div>
    </Modal>
  )
}

export default PolicyEditorModal
