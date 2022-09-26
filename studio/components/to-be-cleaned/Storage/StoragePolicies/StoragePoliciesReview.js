import { Button, Modal } from '@supabase/ui'
import { useState } from 'react'
import SqlEditor from 'components/ui/SqlEditor'

const ReviewEmptyState = () => {
  return (
    <div className="flex items-center justify-center my-10 opacity-50 space-x-2">
      <p>There are no changes made to this policy</p>
    </div>
  )
}

const StoragePoliciesReview = ({
  policyStatements = [],
  onSelectBack = () => {},
  onSelectSave = () => {},
}) => {
  const [isSaving, setIsSaving] = useState(false)
  const onSavePolicy = () => {
    setIsSaving(true)
    onSelectSave()
  }

  return (
    <>
      <Modal.Content>
        <div className="space-y-6 py-8">
          <div className="space-y-8 flex items-center justify-between space-x-4">
            <div className="flex flex-col">
              <p className="text-sm text-scale-1100">
                These are the SQL statements that will be used to create your policies. The suffix
                appended to the end of your policy name (<code>[hashString]_[number]</code>) just
                functions as a unique identifier for each of your policies.
              </p>
            </div>
          </div>
          <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '25rem' }}>
            {policyStatements.length === 0 && <ReviewEmptyState />}
            {policyStatements.map((policy, idx) => {
              let formattedSQLStatement = policy.statement || ''
              return (
                <div key={`policy_${idx}`} className="space-y-2">
                  <span>{policy.description}</span>
                  <div className="h-40">
                    <SqlEditor readOnly defaultValue={formattedSQLStatement} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Modal.Content>
      <div className="px-6 py-4 w-full flex justify-end items-center gap-2 border-t dark:border-dark">
        <Button type="default" onClick={onSelectBack}>
          Back to edit
        </Button>
        {policyStatements.length > 0 && (
          <Button type="primary" onClick={onSavePolicy} loading={isSaving}>
            Save policy
          </Button>
        )}
      </div>
    </>
  )
}

export default StoragePoliciesReview
