import { Button, Typography, Input, Radio } from '@supabase/ui'
import { get } from 'lodash'
import { useEffect } from 'react'

import { usePrevious } from 'hooks'
import SqlEditor from '../SqlEditor'

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
          limit={63}
          onChange={(e) => onUpdatePolicyName(e.target.value)}
        />
        <div className="absolute top-2 right-4">
          <Typography.Text>{name.length}/63</Typography.Text>
        </div>
      </div>
    </div>
  )
}

const PolicyDefinition = ({
  operation = '',
  definition = '',
  check = '',
  onUpdatePolicyUsing = () => {},
  onUpdatePolicyCheck = () => {},
}) => {
  const showUsing = (operation) =>
    ['SELECT', 'UPDATE', 'DELETE', 'ALL'].includes(operation) || !operation
  const showCheck = (operation) => ['INSERT', 'UPDATE', 'ALL'].includes(operation)

  const previousOperation = usePrevious(operation)
  useEffect(() => {
    if (showUsing(previousOperation) && !showUsing(operation)) onUpdatePolicyUsing(null)
    if (showCheck(previousOperation) && !showCheck(operation)) onUpdatePolicyCheck(null)
  }, [operation])

  return (
    <div className="space-y-4">
      {showUsing(operation) && (
        <div className="flex space-x-12">
          <div className="w-1/3 flex flex-col space-y-2">
            <Typography.Text>USING expression</Typography.Text>
            <Typography.Text type="secondary">
              Provide a SQL conditional expression that returns a boolean.
            </Typography.Text>
          </div>
          <div className={`w-2/3 ${showCheck(operation) ? 'h-32' : 'h-56'}`}>
            <SqlEditor defaultValue={definition} onInputChange={onUpdatePolicyUsing} />
          </div>
        </div>
      )}
      {showCheck(operation) && (
        <div className="flex space-x-12">
          <div className="w-1/3 flex flex-col space-y-2">
            <Typography.Text>WITH CHECK expression</Typography.Text>
            <Typography.Text type="secondary">
              Provide a SQL conditional expression that returns a boolean.
            </Typography.Text>
          </div>
          <div className={`w-2/3 ${showUsing(operation) ? 'h-32' : 'h-56'}`}>
            <SqlEditor defaultValue={check} onInputChange={onUpdatePolicyCheck} />
          </div>
        </div>
      )}
    </div>
  )
}

const PolicyAllowedOperation = ({ operation = '', onSelectOperation = () => {} }) => {
  return (
    <div className="flex justify-between space-x-12">
      <div className="w-1/3 flex flex-col space-y-2">
        <Typography.Text>Allowed operation</Typography.Text>
        <Typography.Text type="secondary">Selection an operation for this policy</Typography.Text>
      </div>
      <div className="w-2/3">
        <div className="flex items-center space-x-8">
          <Radio
            name="allowed-operation"
            label="SELECT"
            value="SELECT"
            checked={operation === 'SELECT'}
            onChange={(e) => onSelectOperation(e.target.value)}
          />
          <Radio
            name="allowed-operation"
            label="INSERT"
            value="INSERT"
            checked={operation === 'INSERT'}
            onChange={(e) => onSelectOperation(e.target.value)}
          />
          <Radio
            name="allowed-operation"
            label="UPDATE"
            value="UPDATE"
            checked={operation === 'UPDATE'}
            onChange={(e) => onSelectOperation(e.target.value)}
          />
          <Radio
            name="allowed-operation"
            label="DELETE"
            value="DELETE"
            checked={operation === 'DELETE'}
            onChange={(e) => onSelectOperation(e.target.value)}
          />
          <Radio
            name="allowed-operation"
            label="ALL"
            value="ALL"
            checked={operation === 'ALL'}
            onChange={(e) => onSelectOperation(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

const PolicyEditorFooter = ({
  showTemplates,
  onViewTemplates = () => {},
  onReviewPolicy = () => {},
}) => (
  <div className="px-6 py-3 w-full flex justify-end items-center space-x-4 border-t dark:border-dark">
    {showTemplates && (
      <Button type="secondary" onClick={onViewTemplates}>
        View templates
      </Button>
    )}
    <Button type="primary" onClick={onReviewPolicy}>
      Review
    </Button>
  </div>
)

const PolicyEditor = ({
  isNewPolicy = true,
  policyFormFields = {},
  onUpdatePolicyFormFields = () => {},
  onViewTemplates = () => {},
  onReviewPolicy = () => {},
}) => {
  const operation = get(policyFormFields, ['command'], '')
  const definition = get(policyFormFields, ['definition'], '') || ''
  const check = get(policyFormFields, ['check'], '') || ''

  return (
    <div className="">
      <div className="px-6 space-y-8 mb-8">
        <PolicyName
          name={policyFormFields.name}
          onUpdatePolicyName={(name) => onUpdatePolicyFormFields({ name })}
        />
        {isNewPolicy && (
          <PolicyAllowedOperation
            operation={operation}
            onSelectOperation={(command) => onUpdatePolicyFormFields({ command })}
          />
        )}
        <PolicyDefinition
          operation={operation}
          definition={definition}
          check={check}
          onUpdatePolicyUsing={(definition) => onUpdatePolicyFormFields({ definition })}
          onUpdatePolicyCheck={(check) => onUpdatePolicyFormFields({ check })}
        />
      </div>
      <PolicyEditorFooter
        showTemplates={isNewPolicy}
        onViewTemplates={onViewTemplates}
        onReviewPolicy={onReviewPolicy}
      />
    </div>
  )
}

export default PolicyEditor
