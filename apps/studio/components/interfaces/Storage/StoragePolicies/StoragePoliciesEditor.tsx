import { noop } from 'lodash'
import { Button, Checkbox, cn, Modal } from 'ui'

import { PolicyName } from 'components/interfaces/Auth/Policies/PolicyEditor/PolicyName'
import { PolicyRoles } from 'components/interfaces/Auth/Policies/PolicyEditor/PolicyRoles'
import SqlEditor from 'components/ui/SqlEditor'
import { DOCS_URL } from 'lib/constants'
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
            href={`${DOCS_URL}/reference/javascript/storage-from-list`}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            client library
          </a>
          .
        </p>
      </div>
      <div className="md:w-2/3 flex flex-col gap-3">
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
            <ul key={method} className="mr-2 mt-2 list-none">
              <li
                className={cn(
                  'text-xs font-mono leading-[1.1] px-2 py-1 rounded-full border font-normal whitespace-nowrap transition-colors duration-200',
                  allowedClientLibraryMethods.includes(method)
                    ? 'bg-brand bg-opacity-10 text-brand-600 border-brand-500'
                    : 'bg-surface-75 text-foreground-lighter border-muted'
                )}
              >
                {method}
              </li>
            </ul>
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
