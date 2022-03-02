import { Button, Typography, Input, Radio, Modal } from '@supabase/ui'
import { get } from 'lodash'
import { useEffect } from 'react'

import { usePrevious } from 'hooks'
import SqlEditor from '../SqlEditor'

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
          id="policy-name"
          value={name}
          rows={1}
          limit={63}
          onChange={(e) => onUpdatePolicyName(e.target.value)}
          actions={<span className="text-sm text-scale-900 mr-3">{name.length}/63</span>}
        />
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
            <label className="text-base text-scale-1100" htmlFor="policy-name">
              USING expression
            </label>
            <p className="text-sm text-scale-900">
              Provide a SQL conditional expression that returns a boolean.
            </p>
          </div>
          <div className={`w-2/3 ${showCheck(operation) ? 'h-32' : 'h-56'}`}>
            <SqlEditor defaultValue={definition} onInputChange={onUpdatePolicyUsing} />
          </div>
        </div>
      )}
      {showCheck(operation) && (
        <div className="flex space-x-12">
          <div className="w-1/3 flex flex-col space-y-2">
            <label className="text-base text-scale-1100" htmlFor="policy-name">
              WITH CHECK expression
            </label>
            <p className="text-sm text-scale-900">
              Provide a SQL conditional expression that returns a boolean.
            </p>
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
        <label className="text-base text-scale-1100" htmlFor="allowed-operation">
          Allowed operation
        </label>
        <p className="text-sm text-scale-900">Selection an operation for this policy</p>
      </div>
      <div className="w-2/3">
        <div className="flex items-center space-x-8">
          <Radio.Group type="small-cards" id="allowed-operation">
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
          </Radio.Group>
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
  <div className="px-6 py-4 w-full flex justify-end items-center gap-2 border-t dark:border-dark">
    {showTemplates && (
      <Button type="default" onClick={onViewTemplates}>
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
      <div className="py-8 space-y-8 mb-8">
        <Modal.Content>
          <PolicyName
            name={policyFormFields.name}
            onUpdatePolicyName={(name) => onUpdatePolicyFormFields({ name })}
          />
        </Modal.Content>
        <Modal.Seperator />
        {isNewPolicy && (
          <>
            <Modal.Content>
              <PolicyAllowedOperation
                operation={operation}
                onSelectOperation={(command) => onUpdatePolicyFormFields({ command })}
              />
            </Modal.Content>
            <Modal.Seperator />
          </>
        )}
        <Modal.Content>
          <PolicyDefinition
            operation={operation}
            definition={definition}
            check={check}
            onUpdatePolicyUsing={(definition) => onUpdatePolicyFormFields({ definition })}
            onUpdatePolicyCheck={(check) => onUpdatePolicyFormFields({ check })}
          />
        </Modal.Content>
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
