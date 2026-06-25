import { useEffect, useMemo } from 'react'
import type { Control, FieldValues } from 'react-hook-form'
import { FormItem, FormLabel } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import type { TemporaryAccessGrantDraft } from './TemporaryAccess.types'
import {
  getAssignableTemporaryAccessRoleOptions,
  getTemporaryAccessHiddenRolesDescription,
} from './TemporaryAccess.utils'
import { TemporaryAccessGrantFields } from './TemporaryAccessGrantFields'
import {
  createInviteGuestGrantDraft,
  mergeGuestGrantsWithRoleIds,
} from './TemporaryAccessInvite.utils'
import { TemporaryAccessProjectNotice } from './TemporaryAccessProjectNotice'
import { useDatabaseRolesQuery } from '@/data/database-roles/database-roles-query'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'

type TemporaryAccessInviteGrantSectionProps<TFieldValues extends FieldValues> = {
  projectRef: string
  parentProjectRef?: string | null
  guestAccess: TemporaryAccessGrantDraft
  control: Control<TFieldValues>
  onGuestAccessChange: (next: TemporaryAccessGrantDraft) => void
}

function PostgresRolesFieldLayout({ children }: { children: React.ReactNode }) {
  return (
    <FormItem>
      <div className="relative flex flex-col gap-2 text-base md:grid md:grid-cols-12 md:gap-10 md:text-sm">
        <div className="col-span-4 flex flex-col gap-1">
          <FormLabel className="text-foreground">Postgres roles and settings</FormLabel>
        </div>
        <div className="col-span-8">{children}</div>
      </div>
    </FormItem>
  )
}

function HiddenRolesHelper({ description }: { description: string }) {
  return (
    <p
      className="text-sm font-normal leading-normal text-foreground-lighter"
      data-testid="temporary-access-hidden-roles-helper"
    >
      {description}
    </p>
  )
}

export function TemporaryAccessInviteGrantSection<TFieldValues extends FieldValues>({
  projectRef,
  parentProjectRef,
  guestAccess,
  control,
  onGuestAccessChange,
}: TemporaryAccessInviteGrantSectionProps<TFieldValues>) {
  const { data: project, isSuccess: isProjectDetailSuccess } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: !!projectRef }
  )

  const { data: databaseRoles, isLoading: isLoadingRoles } = useDatabaseRolesQuery(
    { projectRef, connectionString: project?.connectionString },
    {
      enabled: !!projectRef && isProjectDetailSuccess,
      refetchOnMount: 'always',
    }
  )

  const roleOptions = useMemo(
    () => getAssignableTemporaryAccessRoleOptions(databaseRoles),
    [databaseRoles]
  )
  const roleIds = useMemo(() => roleOptions.map((role) => role.id), [roleOptions])
  const hiddenRolesDescription = useMemo(
    () => getTemporaryAccessHiddenRolesDescription(databaseRoles),
    [databaseRoles]
  )

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

  if (isLoadingRoles && guestAccess.grants.length === 0) {
    return (
      <div className="space-y-4">
        <TemporaryAccessProjectNotice projectRef={projectRef} parentProjectRef={parentProjectRef} />
        <ShimmeringLoader className="py-4" />
      </div>
    )
  }

  if (guestAccess.grants.length === 0) {
    return (
      <PostgresRolesFieldLayout>
        <div className="space-y-4">
          <TemporaryAccessProjectNotice
            projectRef={projectRef}
            parentProjectRef={parentProjectRef}
          />
          <Admonition type="note" description="No assignable Postgres roles found." />
        </div>
      </PostgresRolesFieldLayout>
    )
  }

  return (
    <PostgresRolesFieldLayout>
      <div className="space-y-4">
        <TemporaryAccessProjectNotice projectRef={projectRef} parentProjectRef={parentProjectRef} />
        <div className="overflow-hidden rounded-md border">
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
        {hiddenRolesDescription ? <HiddenRolesHelper description={hiddenRolesDescription} /> : null}
      </div>
    </PostgresRolesFieldLayout>
  )
}
