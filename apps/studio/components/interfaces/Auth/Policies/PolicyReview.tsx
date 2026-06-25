import { isEmpty, noop } from 'lodash'
import { useState } from 'react'
import { Button, DialogFooter, DialogSection } from 'ui'

import type { PolicyForReview } from './Policies.types'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'

interface PolicyReviewProps {
  policy: PolicyForReview
  onSelectBack: () => void
  onSelectSave: () => void
}

// [Joshen] This seems like dead code atm, clean up separately

export const PolicyReview = ({
  policy = {},
  onSelectBack = noop,
  onSelectSave = noop,
}: PolicyReviewProps) => {
  const [isSaving, setIsSaving] = useState(false)
  const onSavePolicy = () => {
    setIsSaving(true)
    onSelectSave()
  }

  let formattedSQLStatement = policy.statement || ''

  return (
    <>
      <DialogSection>
        <div className="space-y-6">
          <div className="flex items-center justify-between space-y-8">
            <div className="flex flex-col">
              <p className="text-sm text-foreground-light">
                This is the SQL statement that will be used to create your policy.
              </p>
            </div>
          </div>
          <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '25rem' }}>
            {isEmpty(policy) ? (
              <div className="my-10 flex items-center justify-center space-x-2 opacity-50">
                <p className="text-base text-foreground-light">
                  There are no changes made to this policy
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p>{policy.description}</p>
                <div className="h-40">
                  <CodeEditor
                    hideLineNumbers
                    isReadOnly
                    language="pgsql"
                    defaultValue={formattedSQLStatement}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogSection>
      <DialogFooter>
        <Button variant="default" onClick={onSelectBack}>
          Back to edit
        </Button>
        <Button
          variant="primary"
          disabled={isEmpty(policy)}
          onClick={onSavePolicy}
          loading={isSaving}
        >
          Save policy
        </Button>
      </DialogFooter>
    </>
  )
}
