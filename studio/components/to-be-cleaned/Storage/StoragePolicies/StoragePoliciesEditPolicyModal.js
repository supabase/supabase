import { pull } from 'lodash'
import { useEffect, useState } from 'react'
import { IconChevronLeft, Modal } from 'ui'

import { useStore } from 'hooks'
import {
  applyBucketIdToTemplateDefinition,
  createPayloadsForAddPolicy,
  createSQLPolicies,
} from '../Storage.utils'
import { STORAGE_POLICY_TEMPLATES } from './StoragePolicies.constants'

import {
  PolicySelection,
  PolicyTemplates,
  POLICY_MODAL_VIEWS,
} from 'components/interfaces/Auth/Policies'
import StoragePoliciesEditor from './StoragePoliciesEditor'
import StoragePoliciesReview from './StoragePoliciesReview'

const newPolicyTemplate = {
  name: '',
  roles: [],
  policyIds: [],
  definition: '',
  allowedOperations: [],
}

const StoragePoliciesEditPolicyModal = ({
  visible = false,
  bucketName = '',
  roles = [],
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
  const onViewEditor = (state) => {
    if (state === 'new') {
      setPolicyFormFields({
        ...policyFormFields,
        definition: `bucket_id = '${bucketName}'`,
      })
    }
    setView(POLICY_MODAL_VIEWS.EDITOR)
  }
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

  const onUpdatePolicyRoles = (roles) => {
    setPolicyFormFields({
      ...policyFormFields,
      roles,
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

  const StoragePolicyEditorModalTitle = ({
    view,
    bucketName,
    onSelectBackFromTemplates = () => {},
  }) => {
    const getTitle = () => {
      if (view === POLICY_MODAL_VIEWS.EDITOR || view === POLICY_MODAL_VIEWS.SELECTION) {
        return `Adding new policy to ${bucketName}`
      }
      if (view === POLICY_MODAL_VIEWS.REVIEW) {
        return `Reviewing policies to be created for ${bucketName}`
      }
    }
    if (view === POLICY_MODAL_VIEWS.TEMPLATES) {
      return (
        <div className="">
          <div className="flex items-center space-x-3">
            <span
              onClick={onSelectBackFromTemplates}
              className="cursor-pointer text-foreground-lighter transition-colors hover:text-foreground"
            >
              <IconChevronLeft strokeWidth={2} size={14} />
            </span>
            <h4 className="textlg m-0">Select a template to use for your new policy</h4>
          </div>
        </div>
      )
    }
    return (
      <div className="flex items-center space-x-3">
        <h4 className="m-0 text-lg">{getTitle()}</h4>
      </div>
    )
  }

  return (
    <Modal
      size={view === POLICY_MODAL_VIEWS.SELECTION ? 'medium' : 'xxlarge'}
      closable
      hideFooter
      visible={visible}
      contentStyle={{ padding: 0 }}
      header={[
        <StoragePolicyEditorModalTitle
          key="0"
          view={view}
          bucketName={bucketName}
          onSelectBackFromTemplates={onSelectBackFromTemplates}
        />,
      ]}
      onCancel={onSelectCancel}
    >
      <div className="w-full">
        {view === POLICY_MODAL_VIEWS.SELECTION ? (
          <PolicySelection
            description="PostgreSQL policies control access to your files and folders"
            onViewTemplates={onViewTemplates}
            onViewEditor={() => onViewEditor('new')}
          />
        ) : view === POLICY_MODAL_VIEWS.EDITOR ? (
          <StoragePoliciesEditor
            roles={roles}
            policyFormFields={policyFormFields}
            onViewTemplates={onViewTemplates}
            onUpdatePolicyName={onUpdatePolicyName}
            onUpdatePolicyDefinition={onUpdatePolicyDefinition}
            onToggleOperation={onToggleOperation}
            onUpdatePolicyRoles={onUpdatePolicyRoles}
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
