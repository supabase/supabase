import { useEffect, useMemo } from 'react'
import type { Control, FieldValues } from 'react-hook-form'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import type { TemporaryAccessGrantDraft } from './TemporaryAccess.types'
import { getAssignableTemporaryAccessRoleOptions } from './TemporaryAccess.utils'
import { TemporaryAccessGrantFields } from './TemporaryAccessGrantFields'
import {
  createInviteGuestGrantDraft,
  mergeGuestGrantsWithRoleIds,
} from './TemporaryAccessInvite.utils'
import { InlineLink } from '@/components/ui/InlineLink'
import { useDatabaseRolesQuery } from '@/data/database-roles/database-roles-query'
import { DOCS_URL } from '@/lib/constants'

type TemporaryAccessInviteGrantSectionProps<TFieldValues extends FieldValues> = {
  projectRef: string
  guestAccess: TemporaryAccessGrantDraft
  control: Control<TFieldValues>
  onGuestAccessChange: (next: TemporaryAccessGrantDraft) => void
}

export function TemporaryAccessInviteGrantSection<TFieldValues extends FieldValues>({
  projectRef,
  guestAccess,
  control,
  onGuestAccessChange,
}: TemporaryAccessInviteGrantSectionProps<TFieldValues>) {
  const {
    data: databaseRoles,
    isLoading,
    isError,
  } = useDatabaseRolesQuery({
    projectRef,
  })

  const roleOptions = useMemo(
    () => getAssignableTemporaryAccessRoleOptions(databaseRoles),
    [databaseRoles]
  )
  const roleIds = useMemo(() => roleOptions.map((role) => role.id), [roleOptions])

  useEffect(() => {
    if (!projectRef || roleIds.length === 0) return

    const hasExistingGrants = guestAccess.grants.length > 0
    if (!hasExistingGrants) {
      onGuestAccessChange(createInviteGuestGrantDraft(roleIds))
      return
    }

    onGuestAccessChange(mergeGuestGrantsWithRoleIds(guestAccess, roleIds))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectRef, roleIds.join('|')])

  const updateGrant = (
    roleId: string,
    updater: (
      grant: TemporaryAccessGrantDraft['grants'][number]
    ) => TemporaryAccessGrantDraft['grants'][number]
  ) => {
    onGuestAccessChange({
      ...guestAccess,
      grants: guestAccess.grants.map((grant) => (grant.roleId === roleId ? updater(grant) : grant)),
    })
  }

  if (!projectRef) {
    return <Admonition type="note" description="Select a project to configure database access." />
  }

  if (isLoading && guestAccess.grants.length === 0) {
    return <ShimmeringLoader className="py-4" />
  }

  if (guestAccess.grants.length === 0) {
    return (
      <Admonition
        type="note"
        description={
          isError
            ? 'Could not load Postgres roles from the project. Built-in roles should still appear once the project is reachable.'
            : 'No assignable Postgres roles found.'
        }
      />
    )
  }

  return (
    <FormItemLayout
      layout="horizontal"
      label="Postgres roles and settings"
      description={
        <>
          Same options as{' '}
          <InlineLink href={`${DOCS_URL}/guides/database/postgres/roles`}>
            Manage database access
          </InlineLink>
          . Preset durations start when they accept; custom sets a fixed expiry date.
          {isError ? ' Custom roles could not be loaded from the project.' : null}
        </>
      }
    >
      <div className="col-span-6 overflow-hidden rounded-md border">
        {guestAccess.grants.map((grant, index) => (
          <div key={grant.roleId} className={index > 0 ? 'border-t' : ''}>
            <TemporaryAccessGrantFields
              control={control as unknown as Control<TemporaryAccessGrantDraft>}
              grantIndex={index}
              role={{ id: grant.roleId, label: grant.roleId }}
              grant={grant}
              onChange={(next) => updateGrant(grant.roleId, () => next)}
              expiryContext="on_accept"
              allowNeverExpiry={false}
              grantsFieldName="guestAccess.grants"
            />
          </div>
        ))}
      </div>
    </FormItemLayout>
  )
}
