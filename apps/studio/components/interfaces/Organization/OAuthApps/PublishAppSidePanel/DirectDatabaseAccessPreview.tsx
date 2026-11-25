import { ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'

import type { FormSchemaWithOAuthAppScopedGrants } from './PublishAppSidePanel.utils'

const accessLevels = ['No access', 'Read-only', 'Read and write']

export function DirectDatabaseAccessPreview({
  isPreviewMemberBound,
}: {
  isPreviewMemberBound: boolean
}) {
  const { control } = useFormContext<FormSchemaWithOAuthAppScopedGrants>()
  const isMemberBound = useWatch({ control, name: 'member_bound_grant' })
  const [accessLevel, setAccessLevel] = useState('No access')
  const isDisabled = isPreviewMemberBound || isMemberBound

  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded border p-4">
      <div className="space-y-1">
        <p className="text-sm text-foreground">Direct database access</p>
        <p className="text-xs text-foreground-light">
          {isDisabled
            ? 'Only organization-bound apps can request direct database access.'
            : 'Connect to project databases using your app’s access token.'}
        </p>
        {!isDisabled && accessLevel !== 'No access' && (
          <p className="text-xs text-foreground-light">
            Database role: <code>example_partner_user</code>
          </p>
        )}
        <p className="text-xs text-foreground-light">Local preview. This permission isn’t saved.</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            disabled={isDisabled}
            iconRight={<ChevronDownIcon />}
            aria-label={`Direct database access: ${isDisabled ? 'Unavailable' : accessLevel}`}
          >
            {isDisabled ? 'Unavailable' : accessLevel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup value={accessLevel} onValueChange={setAccessLevel}>
            {accessLevels.map((level) => (
              <DropdownMenuRadioItem key={level} value={level}>
                {level}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
