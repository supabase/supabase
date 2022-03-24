import { Modal, Typography, IconChevronLeft } from '@supabase/ui'
import { useState, useEffect } from 'react'
import { isEmpty } from 'lodash'

import { POLICY_MODAL_VIEWS } from 'lib/constants'
import { getGeneralPolicyTemplates } from './PolicyEditorModal.constants'
import {
  createSQLPolicy,
  createPayloadForCreatePolicy,
  createPayloadForUpdatePolicy,
} from './policyHelpers'

import PolicySelection from './PolicySelection'
import PolicyEditor from './PolicyEditor'
import PolicyReview from './PolicyReview'
import PolicyTemplates from './PolicyTemplates'
import { useStore } from 'hooks'

const PolicyEditorModalTitle = ({
  view,
  schema,
  table,
  isNewPolicy,
  onSelectBackFromTemplates = () => {},
}) => {
  const getTitle = () => {
    if (view === POLICY_MODAL_VIEWS.EDITOR || view === POLICY_MODAL_VIEWS.SELECTION) {
      return `${isNewPolicy ? 'Adding new policy to' : 'Editing policy from'} ${schema}.${table}`
    }
    if (view === POLICY_MODAL_VIEWS.REVIEW) {
      return `Reviewing policy to be ${isNewPolicy ? 'created' : 'updated'} on ${schema}.${table}`
    }
  }
  if (view === POLICY_MODAL_VIEWS.TEMPLATES) {
    return (
      <div className="">
        <div className="flex items-center space-x-3">
          <span
            onClick={onSelectBackFromTemplates}
            className="cursor-pointer text-scale-900 hover:text-scale-1200 transition-colors"
          >
            <IconChevronLeft strokeWidth={2} size={14} />
          </span>
          <Typography.Title level={4} className="m-0">
            Select a template to use for your new policy
          </Typography.Title>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center space-x-3">
      <Typography.Title level={4} className="m-0">
        {getTitle()}
      </Typography.Title>
    </div>
  )
}

const PolicyEditorModal = ({
  visible = false,
  schema = '',
  table = '',
  selectedPolicyToEdit = {},
  onSelectCancel = () => {},
  onCreatePolicy = () => {},
  onUpdatePolicy = () => {},
  onSaveSuccess = () => {},
}) => {
  const { ui } = useStore()

  const newPolicyTemplate = {
    schema,
    table,
    name: '',
    definition: '',
    check: '',
    command: null,
  }

  const isNewPolicy = isEmpty(selectedPolicyToEdit)
  const initializedPolicyFormFields = isNewPolicy ? newPolicyTemplate : selectedPolicyToEdit

  const [previousView, setPreviousView] = useState('') // Mainly to decide which view to show when back from templates
  const [view, setView] = useState(POLICY_MODAL_VIEWS.EDITOR)

  const [policyFormFields, setPolicyFormFields] = useState(initializedPolicyFormFields)
  const [policyStatementForReview, setPolicyStatementForReview] = useState('')

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

  const onUseTemplate = (template) => {
    setPolicyFormFields({
      ...policyFormFields,
      name: template.name,
      definition: template.definition,
      check: template.check,
      command: template.command,
    })
    onViewEditor()
  }

  const onUpdatePolicyFormFields = (field) => {
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
      })
    }
    if (['SELECT', 'DELETE'].includes(command) && !definition) {
      return ui.setNotification({
        category: 'error',
        message: 'Did you forget to provide a USING expression for your policy?',
      })
    }
    if (command === 'INSERT' && !check) {
      return ui.setNotification({
        category: 'error',
        message: 'Did you forget to provide a WITH CHECK expression for your policy?',
      })
    }
    if (command === 'UPDATE' && !definition && !check) {
      return ui.setNotification({
        category: 'error',
        message:
          'You will need to provide either a USING, or WITH CHECK expression, or both for your policy',
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

  const onSavePolicy = async (payload) => {
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
      // style={{ maxWidth: 'none', width: '60rem' }}
      onCancel={onSelectCancel}
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
            policyFormFields={policyFormFields}
            onUpdatePolicyFormFields={onUpdatePolicyFormFields}
            onViewTemplates={onViewTemplates}
            onReviewPolicy={validatePolicyFormFields}
          />
        ) : view === POLICY_MODAL_VIEWS.TEMPLATES ? (
          <PolicyTemplates
            templates={getGeneralPolicyTemplates(schema, table)}
            templatesNote="* References a specific column in the table"
            onSelectBackFromTemplates={onSelectBackFromTemplates}
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
