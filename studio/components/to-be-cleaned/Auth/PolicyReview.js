import { Button, Modal } from '@supabase/ui'
import { isEmpty } from 'lodash'
import { useState } from 'react'

import SqlEditor from '../SqlEditor'

const ReviewEmptyState = () => {
  return (
    <div className="flex items-center justify-center my-10 opacity-50 space-x-2">
      <p className="text-base text-scale-1100">There are no changes made to this policy</p>
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
    <>
      <Modal.Content>
        <div className="space-y-6 py-8">
          <div className="space-y-8 flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm text-scale-1100">
                This is the SQL statement that will be used to create your policy.
              </p>
            </div>
          </div>
          <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '25rem' }}>
            {isEmpty(policy) ? (
              <ReviewEmptyState />
            ) : (
              <div className="space-y-2">
                <span>{policy.description}</span>
                <div className="h-40">
                  <SqlEditor readOnly defaultValue={formattedSQLStatement} />
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal.Content>
      <div className="px-6 py-4 w-full flex justify-end items-center gap-2 border-t dark:border-dark">
        <Button type="default" onClick={onSelectBack}>
          Back to edit
        </Button>
        <Button type="primary" disabled={isEmpty(policy)} onClick={onSavePolicy} loading={isSaving}>
          Save policy
        </Button>
      </div>
    </>
  )
}

export default PolicyReview
