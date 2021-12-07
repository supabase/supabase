import { Modal, Typography, IconChevronLeft } from '@supabase/ui'
import { pull } from 'lodash'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

import { useStore } from 'hooks'
import { POLICY_MODAL_VIEWS } from 'lib/constants'
import { STORAGE_POLICY_TEMPLATES } from './StoragePolicies.constants'
import {
  createPayloadsForAddPolicy,
  createSQLPolicies,
  applyBucketIdToTemplateDefinition,
} from '../Storage.utils'

import PolicySelection from 'components/to-be-cleaned/Auth/PolicySelection'
import PolicyTemplates from 'components/to-be-cleaned/Auth/PolicyTemplates'
import StoragePoliciesEditor from './StoragePoliciesEditor'
import StoragePoliciesReview from './StoragePoliciesReview'

const newPolicyTemplate = {
  name: '',
  policyIds: [],
  definition: '',
  allowedOperations: [],
}

const StoragePoliciesEditPolicyModal = ({
  visible = false,
  bucketName = '',
  onSelectCancel = () => {},
  onCreatePolicies = () => {},
  onSaveSuccess = () => {},
}) => {
  const { ui } = useStore()
  const [previousView, setPreviousView] = useState('') // Mainly to decide which view to show when back from templates
  const [view, setView] = useState('')

  const [policyFormFields, setPolicyFormFields] = useState(newPolicyTemplate)
  const [policyStatementsForReview, setPolicyStatementsForReview] = useState([])

  useEffect(() => {
    if (visible) {
      onViewIntro()
      setPolicyFormFields(newPolicyTemplate)
    }
  }, [visible])

  /* Methods to determine which step to show */
  const onViewIntro = () => setView(POLICY_MODAL_VIEWS.SELECTION)
  const onViewEditor = () => setView(POLICY_MODAL_VIEWS.EDITOR)
  const onViewTemplates = () => {
    setPreviousView(view)
    setView(POLICY_MODAL_VIEWS.TEMPLATES)
  }
  const onReviewPolicy = () => setView(POLICY_MODAL_VIEWS.REVIEW)

  /* Methods for policy templates */
  const onSelectBackFromTemplates = () => setView(previousView)
  const onUseTemplate = (template) => {
    // Each template has an id as a unique identifier to refresh the SQL editor
    // but we don't need this property to be in the policyFormField
    const { id, ...templateFields } = template
    const definition = applyBucketIdToTemplateDefinition(templateFields.definition, bucketName)
    setPolicyFormFields({
      ...policyFormFields,
      ...templateFields,
      definition: definition,
    })
    onViewEditor()
  }

  /* Methods for policy editor form fields */
  const onUpdatePolicyName = (name) => {
    if (name.length <= 50) {
      setPolicyFormFields({
        ...policyFormFields,
        name,
      })
    }
  }

  const onUpdatePolicyDefinition = (definition) => {
    setPolicyFormFields({
      ...policyFormFields,
      definition,
    })
  }

  const onToggleOperation = (operation, isSingleOperation = false) => {
    if (isSingleOperation) {
      return setPolicyFormFields({
        ...policyFormFields,
        allowedOperations: [operation],
      })
    }
    const updatedAllowedOperations = policyFormFields.allowedOperations.includes(operation)
      ? pull(policyFormFields.allowedOperations.slice(), operation)
      : policyFormFields.allowedOperations.concat([operation])
    return setPolicyFormFields({
      ...policyFormFields,
      allowedOperations: updatedAllowedOperations,
    })
  }

  const validatePolicyEditorFormFields = () => {
    const { name, definition, allowedOperations } = policyFormFields
    if (name.length === 0) {
      return ui.setNotification({ category: 'info', message: 'Do give your policy a name' })
    }
    if (definition.length === 0) {
      // Will need to figure out how to strip away comments or something
      return ui.setNotification({
        category: 'info',
        message: 'Did you forget to provide a definition for your policy?',
      })
    }
    if (allowedOperations.length === 0) {
      return ui.setNotification({
        category: 'info',
        message: 'You will need to allow at least one operation in your policy',
      })
    }
    const policySQLStatements = createSQLPolicies(bucketName, policyFormFields)
    setPolicyStatementsForReview(policySQLStatements)
    onReviewPolicy()
  }

  /* Create policy payloads to be sent upstream to API endpoint */
  const onReviewSave = () => {
    const payloads = createPayloadsForAddPolicy(bucketName, policyFormFields)
    onSavePolicy(payloads)
  }

  const onSavePolicy = async (payloads) => {
    const errors = await onCreatePolicies(payloads)
    const hasErrors = errors.indexOf(true) !== -1
    if (hasErrors) {
      onViewEditor()
    } else {
      onSaveSuccess()
    }
  }

  /* Misc components */
  const StoragePolicyTemplatesTitle = () => (
    <div className="px-6 pt-5">
      <div className="flex items-center space-x-3">
        <Typography.Text type="secondary">
          <div className="cursor-pointer" onClick={onSelectBackFromTemplates}>
            <IconChevronLeft />
          </div>
        </Typography.Text>
        <Typography.Title level={4} className="m-0">
          Select a template to use for your new policy
        </Typography.Title>
      </div>
    </div>
  )

  const StoragePolicyReviewTitle = ({ bucketName = '' }) => (
    <div className="flex items-center space-x-3 px-6 pt-5">
      <Typography.Title level={4} className="m-0">
        Reviewing policies to be added for {bucketName}
      </Typography.Title>
    </div>
  )

  const StoragePolicyTitle = ({ bucketName = '' }) => (
    <div className="flex items-center space-x-3 px-6 pt-5">
      <Typography.Title level={4} className="m-0">
        Adding new policy to ${bucketName}
      </Typography.Title>
    </div>
  )

  return (
    <Modal
      closable
      hideFooter
      visible={visible}
      contentStyle={{ padding: 0 }}
      title={
        view === POLICY_MODAL_VIEWS.TEMPLATES
          ? [<StoragePolicyTemplatesTitle key="0" />]
          : view === POLICY_MODAL_VIEWS.REVIEW
          ? [<StoragePolicyReviewTitle key="1" bucketName={bucketName} />]
          : [<StoragePolicyTitle key="2" bucketName={bucketName} />]
      }
      style={{ maxWidth: 'none', width: '60rem' }}
      onCancel={onSelectCancel}
    >
      <div className="w-full">
        {view === POLICY_MODAL_VIEWS.SELECTION ? (
          <PolicySelection
            description="PostgreSQL policies control access to your files and folders"
            onViewTemplates={onViewTemplates}
            onViewEditor={onViewEditor}
          />
        ) : view === POLICY_MODAL_VIEWS.EDITOR ? (
          <StoragePoliciesEditor
            policyFormFields={policyFormFields}
            onViewTemplates={onViewTemplates}
            onUpdatePolicyName={onUpdatePolicyName}
            onUpdatePolicyDefinition={onUpdatePolicyDefinition}
            onToggleOperation={onToggleOperation}
            onReviewPolicy={validatePolicyEditorFormFields}
          />
        ) : view === POLICY_MODAL_VIEWS.TEMPLATES ? (
          <PolicyTemplates
            templates={STORAGE_POLICY_TEMPLATES}
            onSelectBackFromTemplates={onSelectBackFromTemplates}
            onUseTemplate={onUseTemplate}
          />
        ) : view === POLICY_MODAL_VIEWS.REVIEW ? (
          <StoragePoliciesReview
            policyStatements={policyStatementsForReview}
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

export default StoragePoliciesEditPolicyModal
