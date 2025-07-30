import { noop, pull } from 'lodash'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { POLICY_MODAL_VIEWS } from 'components/interfaces/Auth/Policies/Policies.constants'
import PolicySelection from 'components/interfaces/Auth/Policies/PolicySelection'
import PolicyTemplates from 'components/interfaces/Auth/Policies/PolicyTemplates'
import { DocsButton } from 'components/ui/DocsButton'
import { ChevronLeft } from 'lucide-react'
import { Modal } from 'ui'
import {
  applyBucketIdToTemplateDefinition,
  createPayloadsForAddPolicy,
  createSQLPolicies,
} from '../Storage.utils'
import { STORAGE_POLICY_TEMPLATES } from './StoragePolicies.constants'
import StoragePoliciesEditor from './StoragePoliciesEditor'
import StoragePoliciesReview from './StoragePoliciesReview'

const newPolicyTemplate: any = {
  name: '',
  roles: [],
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
}: any) => {
  const [previousView, setPreviousView] = useState('') // Mainly to decide which view to show when back from templates
  const [view, setView] = useState('')

  const [policyFormFields, setPolicyFormFields] = useState(newPolicyTemplate)
  const [policyStatementsForReview, setPolicyStatementsForReview] = useState<any[]>([])

  useEffect(() => {
    if (visible) {
      onViewIntro()
      setPolicyFormFields(newPolicyTemplate)
    }
  }, [visible])

  /* Methods to determine which step to show */
  const onViewIntro = () => setView(POLICY_MODAL_VIEWS.SELECTION)
  const onViewEditor = (state?: any) => {
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
  const onUseTemplate = (template: any) => {
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
  const onUpdatePolicyName = (name: string) => {
    if (name.length <= 50) {
      setPolicyFormFields({
        ...policyFormFields,
        name,
      })
    }
  }

  const onUpdatePolicyDefinition = (definition: any) => {
    setPolicyFormFields({
      ...policyFormFields,
      definition,
    })
  }

  const onToggleOperation = (operation: any, isSingleOperation = false) => {
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

  const onUpdatePolicyRoles = (roles: any) => {
    setPolicyFormFields({
      ...policyFormFields,
      roles,
    })
  }

  const validatePolicyEditorFormFields = () => {
    const { name, definition, allowedOperations } = policyFormFields
    if (name.length === 0) {
      return toast.error('Please provide a name for your policy')
    }
    if (definition.length === 0) {
      // Will need to figure out how to strip away comments or something
      return toast.error('Please provide a definition for your policy')
    }
    if (allowedOperations.length === 0) {
      return toast.error('Please allow at least one operation in your policy')
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

  const onSavePolicy = async (payloads: any) => {
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
    onSelectBackFromTemplates = noop,
  }: any) => {
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
        <div>
          <div className="flex items-center space-x-3">
            <span
              onClick={onSelectBackFromTemplates}
              className="cursor-pointer text-foreground-lighter transition-colors hover:text-foreground"
            >
              <ChevronLeft strokeWidth={2} size={14} />
            </span>
            <h4 className="textlg m-0">Select a template to use for your new policy</h4>
          </div>
        </div>
      )
    }
    return (
      <div className="w-full flex items-center justify-between gap-x-2 pr-6">
        <h4 className="m-0 truncate">{getTitle()}</h4>
        <DocsButton href="https://supabase.com/docs/learn/auth-deep-dive/auth-policies" />
      </div>
    )
  }

  return (
    <Modal
      hideFooter
      className="[&>div:first-child]:py-3"
      size={view === POLICY_MODAL_VIEWS.SELECTION ? 'medium' : 'xxlarge'}
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
            showAssistantPreview={false}
          />
        ) : view === POLICY_MODAL_VIEWS.EDITOR ? (
          <StoragePoliciesEditor
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
            templates={STORAGE_POLICY_TEMPLATES as any[]}
            onUseTemplate={onUseTemplate}
            templatesNote={''}
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
