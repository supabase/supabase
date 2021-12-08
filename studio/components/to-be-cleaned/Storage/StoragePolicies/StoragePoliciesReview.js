import { Button, Typography } from '@supabase/ui'
import { useState } from 'react'
import SqlEditor from 'components/to-be-cleaned/SqlEditor'

const ReviewEmptyState = () => {
  return (
    <div className="flex items-center justify-center my-10 opacity-50 space-x-2">
      <Typography.Text>There are no changes made to this policy</Typography.Text>
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
    <div className="space-y-6">
      <div className="px-6 space-y-8 flex items-center justify-between space-x-4">
        <div className="flex flex-col">
          <Typography.Text>
            These are the SQL statements that will be used to create your policies. The suffix
            appended to the end of your policy name (
            <Typography.Text code>[hashString]_[number]</Typography.Text>) just functions as a
            unique identifier for each of your policies.
          </Typography.Text>
        </div>
      </div>
      <div className="px-6 space-y-4 overflow-y-auto" style={{ maxHeight: '25rem' }}>
        {policyStatements.length === 0 && <ReviewEmptyState />}
        {policyStatements.map((policy, idx) => {
          let formattedSQLStatement = policy.statement || ''
          return (
            <div key={`policy_${idx}`} className="space-y-2">
              <Typography.Text>{policy.description}</Typography.Text>
              <div className="h-40">
                <SqlEditor readOnly defaultValue={formattedSQLStatement} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="px-6 py-3 w-full flex justify-end items-center space-x-4 border-t dark:border-dark">
        <Button type="secondary" onClick={onSelectBack}>
          Back to edit
        </Button>
        {policyStatements.length > 0 && (
          <Button type="primary" onClick={onSavePolicy} loading={isSaving}>
            Save policy
          </Button>
        )}
      </div>
    </div>
  )
}

export default StoragePoliciesReview
