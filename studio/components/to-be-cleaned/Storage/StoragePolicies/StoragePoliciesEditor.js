import { Badge, Button, Checkbox, Input, Typography } from '@supabase/ui'
import { get } from 'lodash'

import { STORAGE_CLIENT_LIBRARY_MAPPINGS } from '../Storage.constants'
import { deriveAllowedClientLibraryMethods } from '../Storage.utils'
import SqlEditor from 'components/to-be-cleaned/SqlEditor'

const PolicyName = ({ name = '', onUpdatePolicyName = () => {} }) => {
  return (
    <div className="flex space-x-12">
      <div className="w-1/3 flex flex-col space-y-2">
        <Typography.Text>Policy name</Typography.Text>
        <Typography.Text type="secondary">A descriptive name for your policy.</Typography.Text>
      </div>
      <div className="w-2/3 relative">
        <Input
          value={name}
          rows={1}
          limit={50}
          onChange={(e) => onUpdatePolicyName(e.target.value)}
        />
        <div className="absolute top-2 right-4">
          <Typography.Text>{name.length}/50</Typography.Text>
        </div>
      </div>
    </div>
  )
}

const PolicyDefinition = ({ definition = '', onUpdatePolicyDefinition = () => {} }) => {
  return (
    <div className="flex space-x-12">
      <div className="w-1/3 flex flex-col space-y-2">
        <Typography.Text>Policy definition</Typography.Text>
        <Typography.Text type="secondary">
          Provide a SQL conditional expression that returns a boolean.
        </Typography.Text>
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
        <Typography.Text>Allowed operations</Typography.Text>
        <Typography.Text type="secondary">
          Based on the operations you have selected, you can use any of the highlighted functions in
          the supabase-js Javascript library
        </Typography.Text>
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
    <Button type="secondary" onClick={onViewTemplates}>
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
      <div className="px-6 space-y-8 mb-8">
        <PolicyName name={policyFormFields.name} onUpdatePolicyName={onUpdatePolicyName} />
        <PolicyAllowedOperations
          allowedOperations={policyFormFields.allowedOperations}
          onToggleOperation={onToggleOperation}
        />
        <PolicyDefinition
          definition={definition}
          onUpdatePolicyDefinition={onUpdatePolicyDefinition}
        />
      </div>
      <PolicyEditorFooter onViewTemplates={onViewTemplates} onReviewPolicy={onReviewPolicy} />
    </div>
  )
}

export default StoragePoliciesEditor
