import { Badge, Button, Checkbox, Input, Radio, Modal } from '@supabase/ui'
import { get } from 'lodash'

import { STORAGE_CLIENT_LIBRARY_MAPPINGS } from '../Storage.constants'
import { deriveAllowedClientLibraryMethods } from '../Storage.utils'
import SqlEditor from 'components/to-be-cleaned/SqlEditor'

const PolicyName = ({ name = '', onUpdatePolicyName = () => {} }) => {
  return (
    <div className="flex space-x-12">
      <div className="w-1/3 flex flex-col space-y-2">
        <label className="text-base text-scale-1100" htmlFor="policy-name">
          Policy name
        </label>
        <p className="text-sm text-scale-900">A descriptive name for your policy</p>
      </div>
      <div className="w-2/3 relative">
        <Input
          value={name}
          rows={1}
          limit={50}
          onChange={(e) => onUpdatePolicyName(e.target.value)}
          actions={<span className="text-sm text-scale-900 mr-3">{name.length}/50</span>}
        />
      </div>
    </div>
  )
}

const PolicyDefinition = ({ definition = '', onUpdatePolicyDefinition = () => {} }) => {
  return (
    <div className="flex space-x-12">
      <div className="w-1/3 flex flex-col space-y-2">
        <label className="text-base text-scale-1100" htmlFor="policy-name">
          Policy definition
        </label>
        <p className="text-sm text-scale-900">
          Provide a SQL conditional expression that returns a boolean.
        </p>
      </div>
      <div className="w-2/3 h-56">
        <SqlEditor defaultValue={definition} onInputChange={onUpdatePolicyDefinition} />
      </div>
    </div>
  )
}

const PolicyAllowedOperations = ({ allowedOperations = [], onToggleOperation = () => {} }) => {
  const allowedClientLibraryMethods = deriveAllowedClientLibraryMethods(allowedOperations)
  return (
    <div className="flex justify-between space-x-12">
      <div className="w-1/3 flex flex-col space-y-2">
        <label className="text-base text-scale-1100" htmlFor="allowed-operation">
          Allowed operation
        </label>
        <p className="text-sm text-scale-900">
          Based on the operations you have selected, you can use any of the highlighted functions in
          the supabase-js JavaScript library
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
        <div className="flex flex-wrap w-5/6">
          {Object.keys(STORAGE_CLIENT_LIBRARY_MAPPINGS).map((method) => (
            <div key={method} className="font-mono mr-2 mt-2">
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
  <div className="px-6 py-3 w-full flex justify-end items-center space-x-4 border-t dark:border-dark">
    <Button type="default" onClick={onViewTemplates}>
      View templates
    </Button>
    <Button type="primary" onClick={onReviewPolicy}>
      Review
    </Button>
  </div>
)

const StoragePoliciesEditor = ({
  policyFormFields = {},
  onViewTemplates = () => {},
  onUpdatePolicyName = () => {},
  onUpdatePolicyDefinition = () => {},
  onToggleOperation = () => {},
  onReviewPolicy = () => {},
}) => {
  const definition = get(policyFormFields, ['definition'])

  return (
    <div className="">
      <div className="py-6 space-y-8 mb-8">
        <Modal.Content>
          <PolicyName name={policyFormFields.name} onUpdatePolicyName={onUpdatePolicyName} />
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
