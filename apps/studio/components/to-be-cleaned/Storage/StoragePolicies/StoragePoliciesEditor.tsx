import { noop } from 'lodash'
import { Badge, Button, Checkbox, Modal } from 'ui'

import { PolicyName, PolicyRoles } from 'components/interfaces/Auth/Policies/PolicyEditor'
import SqlEditor from 'components/ui/SqlEditor'
import { STORAGE_CLIENT_LIBRARY_MAPPINGS } from '../Storage.constants'
import { deriveAllowedClientLibraryMethods } from '../Storage.utils'

const PolicyDefinition = ({ definition = '', onUpdatePolicyDefinition = () => {} }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-12">
      <div className="flex md:w-1/3 flex-col space-y-2">
        <label className="text-base text-foreground-light" htmlFor="policy-name">
          Policy definition
        </label>
        <p className="text-sm text-foreground-lighter">
          Provide a SQL conditional expression that returns a boolean.
        </p>
      </div>
      <div className="h-56 md:w-2/3">
        <SqlEditor defaultValue={definition} onInputChange={onUpdatePolicyDefinition} />
      </div>
    </div>
  )
}

const PolicyAllowedOperations = ({ allowedOperations = [], onToggleOperation = () => {} }: any) => {
  const allowedClientLibraryMethods = deriveAllowedClientLibraryMethods(allowedOperations)
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-12">
      <div className="flex md:w-1/3 flex-col space-y-2">
        <label className="text-base text-foreground-light" htmlFor="allowed-operation">
          Allowed operation
        </label>
        <p className="text-sm text-foreground-lighter">
          Based on the operations you have selected, you can use the highlighted functions in the{' '}
          <a
            href="https://supabase.com/docs/reference/javascript/storage-from-list"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            client library
          </a>
          .
        </p>
      </div>
      <div className="md:w-2/3">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <Checkbox
            label="SELECT"
            onChange={() => onToggleOperation('SELECT')}
            checked={allowedOperations.includes('SELECT')}
          />
          <Checkbox
            label="INSERT"
            onChange={() => onToggleOperation('INSERT')}
            checked={allowedOperations.includes('INSERT')}
          />
          <Checkbox
            label="UPDATE"
            onChange={() => onToggleOperation('UPDATE')}
            checked={allowedOperations.includes('UPDATE')}
          />
          <Checkbox
            label="DELETE"
            onChange={() => onToggleOperation('DELETE')}
            checked={allowedOperations.includes('DELETE')}
          />
        </div>
        <div className="flex w-5/6 flex-wrap">
          {Object.keys(STORAGE_CLIENT_LIBRARY_MAPPINGS).map((method) => (
            <div key={method} className="mr-2 mt-2 font-mono">
              <Badge variant={allowedClientLibraryMethods.includes(method) ? 'brand' : 'default'}>
                {method}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const PolicyEditorFooter = ({ onViewTemplates = () => {}, onReviewPolicy = () => {} }) => (
  <div className="flex w-full items-center justify-end gap-x-2 border-t px-6 py-3 border-default">
    <Button type="default" onClick={onViewTemplates}>
      View templates
    </Button>
    <Button type="primary" onClick={onReviewPolicy}>
      Review
    </Button>
  </div>
)

// [Refactor] All these update methods could be summarised into one single function probably

const StoragePoliciesEditor = ({
  policyFormFields = {},
  onViewTemplates = noop,
  onUpdatePolicyName = noop,
  onUpdatePolicyDefinition = noop,
  onToggleOperation = noop,
  onUpdatePolicyRoles = noop,
  onReviewPolicy = noop,
}: any) => {
  const definition = policyFormFields.definition
  const selectedRoles = policyFormFields.roles

  return (
    <>
      <div className="space-y-4 py-4">
        <Modal.Content>
          <PolicyName
            name={policyFormFields.name}
            limit={50}
            onUpdatePolicyName={onUpdatePolicyName}
          />
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content>
          <PolicyAllowedOperations
            allowedOperations={policyFormFields.allowedOperations}
            onToggleOperation={onToggleOperation}
          />
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content>
          <PolicyRoles selectedRoles={selectedRoles} onUpdateSelectedRoles={onUpdatePolicyRoles} />
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content>
          <PolicyDefinition
            definition={definition}
            onUpdatePolicyDefinition={onUpdatePolicyDefinition}
          />
        </Modal.Content>
      </div>
      <PolicyEditorFooter onViewTemplates={onViewTemplates} onReviewPolicy={onReviewPolicy} />
    </>
  )
}

export default StoragePoliciesEditor
