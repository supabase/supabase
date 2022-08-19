import { Badge, Button, Checkbox, Input, Modal } from '@supabase/ui'
import { get } from 'lodash'

import { STORAGE_CLIENT_LIBRARY_MAPPINGS } from '../Storage.constants'
import { deriveAllowedClientLibraryMethods } from '../Storage.utils'
import SqlEditor from 'components/ui/SqlEditor'
import { PolicyName, PolicyRoles } from 'components/interfaces/Authentication/Policies/PolicyEditor'

const PolicyDefinition = ({ definition = '', onUpdatePolicyDefinition = () => {} }) => {
  return (
    <div className="flex space-x-12">
      <div className="flex w-1/3 flex-col space-y-2">
        <label className="text-scale-1100 text-base" htmlFor="policy-name">
          Policy definition
        </label>
        <p className="text-scale-900 text-sm">
          Provide a SQL conditional expression that returns a boolean.
        </p>
      </div>
      <div className="h-56 w-2/3">
        <SqlEditor defaultValue={definition} onInputChange={onUpdatePolicyDefinition} />
      </div>
    </div>
  )
}

const PolicyAllowedOperations = ({ allowedOperations = [], onToggleOperation = () => {} }) => {
  const allowedClientLibraryMethods = deriveAllowedClientLibraryMethods(allowedOperations)
  return (
    <div className="flex justify-between space-x-12">
      <div className="flex w-1/3 flex-col space-y-2">
        <label className="text-scale-1100 text-base" htmlFor="allowed-operation">
          Allowed operation
        </label>
        <p className="text-scale-900 text-sm">
          Based on the operations you have selected, you can use the highlighted functions in the{' '}
          <a
            href="https://supabase.com/docs/reference/javascript/storage-from-list"
            target="_blank"
            className="underline"
          >
            client library
          </a>
          .
        </p>
      </div>
      <div className="w-2/3">
        <div className="flex items-center space-x-8">
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
              <Badge color={allowedClientLibraryMethods.includes(method) ? 'green' : 'gray'}>
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
  <div className="dark:border-dark flex w-full items-center justify-end space-x-4 border-t px-6 py-3">
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
  roles = [],
  onViewTemplates = () => {},
  onUpdatePolicyName = () => {},
  onUpdatePolicyDefinition = () => {},
  onToggleOperation = () => {},
  onUpdatePolicyRoles = () => {},
  onReviewPolicy = () => {},
}) => {
  const definition = policyFormFields.definition
  const selectedRoles = policyFormFields.roles

  return (
    <div className="">
      <div className="mb-8 space-y-8 py-6">
        <Modal.Content>
          <PolicyName
            name={policyFormFields.name}
            limit={50}
            onUpdatePolicyName={onUpdatePolicyName}
          />
        </Modal.Content>
        <Modal.Seperator />
        <Modal.Content>
          <PolicyAllowedOperations
            allowedOperations={policyFormFields.allowedOperations}
            onToggleOperation={onToggleOperation}
          />
        </Modal.Content>
        <Modal.Seperator />
        <Modal.Content>
          <PolicyRoles
            roles={roles}
            selectedRoles={selectedRoles}
            onUpdateSelectedRoles={onUpdatePolicyRoles}
          />
        </Modal.Content>
        <Modal.Seperator />
        <Modal.Content>
          <PolicyDefinition
            definition={definition}
            onUpdatePolicyDefinition={onUpdatePolicyDefinition}
          />
        </Modal.Content>
      </div>
      <PolicyEditorFooter onViewTemplates={onViewTemplates} onReviewPolicy={onReviewPolicy} />
    </div>
  )
}

export default StoragePoliciesEditor
