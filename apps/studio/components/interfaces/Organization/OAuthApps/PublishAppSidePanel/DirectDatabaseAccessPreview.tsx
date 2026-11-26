import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'

import { AccessLevelDropdown, type AccessLevel } from './AccessLevelDropdown'
import type { FormSchemaWithOAuthAppScopedGrants } from './PublishAppSidePanel.utils'

const accessLevels: AccessLevel[] = ['No access', 'Read only', 'Read and write']

export function DirectDatabaseAccessPreview({
  isPreviewMemberBound,
}: {
  isPreviewMemberBound: boolean
}) {
  const { control } = useFormContext<FormSchemaWithOAuthAppScopedGrants>()
  const isMemberBound = useWatch({ control, name: 'member_bound_grant' })
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('No access')
  const isDisabled = isPreviewMemberBound || isMemberBound

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_10rem] items-start gap-3 border p-4">
      <div className="space-y-1">
        <p className="text-sm text-foreground">Table data</p>
        <p className="text-xs text-foreground-light">
          {isDisabled
            ? 'Direct database access needs approval from an organization owner. Create an app with “Use the permissions of the person who connects” turned off.'
            : 'Connect directly to Postgres to access table data using your app’s access token.'}
        </p>
      </div>
      <div className={isDisabled ? 'cursor-not-allowed' : undefined}>
        <AccessLevelDropdown
          permission="Table data"
          levels={accessLevels}
          value={accessLevel}
          disabled={isDisabled}
          onChange={setAccessLevel}
        />
      </div>
    </div>
  )
}
