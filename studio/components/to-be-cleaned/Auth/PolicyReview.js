import { Button, Typography } from '@supabase/ui'
import { isEmpty } from 'lodash'
import { useState } from 'react'
import SqlEditor from '../SqlEditor'

const ReviewEmptyState = () => {
  return (
    <div className="flex items-center justify-center my-10 opacity-50 space-x-2">
      <Typography.Text>There are no changes made to this policy</Typography.Text>
    </div>
  )
}

const PolicyReview = ({ policy = {}, onSelectBack = () => {}, onSelectSave = () => {} }) => {
  const [isSaving, setIsSaving] = useState(false)
  const onSavePolicy = () => {
    setIsSaving(true)
    onSelectSave()
  }

  let formattedSQLStatement = policy.statement || ''

  return (
    <div className="space-y-6">
      <div className="px-6 space-y-8 flex items-center justify-between space-x-4">
        <div className="flex flex-col">
          <Typography.Text>
            This is the SQL statement that will be used to create your policy.
          </Typography.Text>
        </div>
      </div>
      <div className="px-6 space-y-4 overflow-y-auto" style={{ maxHeight: '25rem' }}>
        {isEmpty(policy) ? (
          <ReviewEmptyState />
        ) : (
          <div className="space-y-2">
            <Typography.Text>{policy.description}</Typography.Text>
            <div className="h-40">
              <SqlEditor readOnly defaultValue={formattedSQLStatement} />
            </div>
          </div>
        )}
      </div>
      <div className="px-6 py-3 w-full flex justify-end items-center space-x-4 border-t dark:border-dark">
        <Button type="secondary" onClick={onSelectBack}>
          Back to edit
        </Button>
        <Button type="primary" disabled={isEmpty(policy)} onClick={onSavePolicy} loading={isSaving}>
          Save policy
        </Button>
      </div>
    </div>
  )
}

export default PolicyReview
