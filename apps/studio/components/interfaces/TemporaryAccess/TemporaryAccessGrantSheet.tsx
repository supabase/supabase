import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Form,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import type {
  TemporaryAccessExpiryMode,
  TemporaryAccessGrantDraft,
  TemporaryAccessGrantSheetMode,
} from './TemporaryAccess.types'
import {
  createGrantDraft,
  draftFromUserRule,
  getAssignableTemporaryAccessRoleOptions,
  getInvalidIpRangeRows,
  mapJitMembersToUserRules,
  serializeDraftRolesForGrantMutation,
} from './TemporaryAccess.utils'
import { TemporaryAccessGrantFields } from './TemporaryAccessGrantFields'
import { TemporaryAccessProjectNotice } from './TemporaryAccessProjectNotice'
import { useAutoEnableJitAccess } from './useAutoEnableJitAccess'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { InlineLink } from '@/components/ui/InlineLink'
import { OrganizationProjectSelector } from '@/components/ui/OrganizationProjectSelector'
import { useDatabaseRolesQuery } from '@/data/database-roles/database-roles-query'
import { useJitDbAccessGrantMutation } from '@/data/jit-db-access/jit-db-access-grant-mutation'
import { useJitDbAccessMembersQuery } from '@/data/jit-db-access/jit-db-access-members-query'
import { useJitDbAccessRevokeMutation } from '@/data/jit-db-access/jit-db-access-revoke-mutation'
import { useProjectMembersQuery } from '@/data/projects/project-members-query'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { DOCS_URL } from '@/lib/constants'

const grantSchema = z.object({
  roleId: z.string(),
  enabled: z.boolean(),
  branchesOnly: z.boolean(),
  expiryMode: z.custom<TemporaryAccessExpiryMode>(),
  hasExpiry: z.boolean(),
  expiry: z.string(),
  ipRanges: z.array(z.object({ value: z.string() })),
})

function createGrantFormSchema() {
  return z
    .object({
      memberId: z.string().min(1, 'Member is required.'),
      grants: z.array(grantSchema),
    })
    .superRefine((data, ctx) => {
      const enabledGrantCount = data.grants.filter((g) => g.enabled).length
      if (enabledGrantCount === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['grants'],
          message: 'Select at least one Postgres role.',
        })
        return
      }

      data.grants.forEach((grant, grantIndex) => {
        if (!grant.enabled) return

        const invalidCidrs = new Set(getInvalidIpRangeRows(grant.ipRanges))

        grant.ipRanges.forEach((ipRange, ipRangeIndex) => {
          const value = ipRange.value.trim()
          if (value.length === 0 || !invalidCidrs.has(value)) return

          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['grants', grantIndex, 'ipRanges', ipRangeIndex, 'value'],
            message: 'Please enter a valid CIDR range',
          })
        })
      })
    })
}

type TemporaryAccessGrantSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberId: string
  memberLabel: string
  projectRef?: string
  mode?: TemporaryAccessGrantSheetMode
}

export function TemporaryAccessGrantSheet({
  open,
  onOpenChange,
  memberId,
  memberLabel,
  projectRef: initialProjectRef,
  mode = 'edit',
}: TemporaryAccessGrantSheetProps) {
  const [projectRef, setProjectRef] = useState(initialProjectRef ?? '')
  const [parentProjectRef, setParentProjectRef] = useState<string | null>(null)
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)

  const resolvedProjectRef = projectRef || initialProjectRef

  const { data: databaseRoles, isSuccess: isSuccessDatabaseRoles } = useDatabaseRolesQuery(
    { projectRef: resolvedProjectRef },
    { refetchOnMount: 'always' }
  )
  const roleOptions = useMemo(
    () => getAssignableTemporaryAccessRoleOptions(databaseRoles),
    [databaseRoles]
  )
  const roleIds = useMemo(() => roleOptions.map((role) => role.id), [roleOptions])

  const { data: jitMembers, isSuccess: isSuccessJitMembers } = useJitDbAccessMembersQuery({
    projectRef: resolvedProjectRef,
  })
  const { data: projectMembers, isSuccess: isSuccessProjectMembers } = useProjectMembersQuery({
    projectRef: resolvedProjectRef,
  })

  const users = useMemo(
    () => mapJitMembersToUserRules(jitMembers, projectMembers, roleOptions),
    [jitMembers, projectMembers, roleOptions]
  )
  const existingRule = users.find((user) => user.memberId === memberId)
  const isDataReady =
    !!resolvedProjectRef && isSuccessDatabaseRoles && isSuccessJitMembers && isSuccessProjectMembers

  const defaultValues = useMemo(() => {
    if (existingRule) return draftFromUserRule(existingRule, roleIds)
    return { ...createGrantDraft(roleIds), memberId }
  }, [existingRule, memberId, roleIds])

  const form = useForm<TemporaryAccessGrantDraft>({
    defaultValues,
    resolver: zodResolver(createGrantFormSchema()),
  })
  const grants = form.watch('grants')

  const { ensureEnabled } = useAutoEnableJitAccess(resolvedProjectRef)

  const onCloseSheet = () => onOpenChange(false)

  const {
    confirmOnClose,
    handleOpenChange,
    modalProps: closeConfirmationModalProps,
  } = useConfirmOnClose({
    checkIsDirty: () => form.formState.isDirty,
    onClose: onCloseSheet,
  })

  const { mutateAsync: grantUserAccess, isPending: isGranting } = useJitDbAccessGrantMutation()
  const { mutateAsync: revokeUserAccess, isPending: isRevoking } = useJitDbAccessRevokeMutation()

  const isSubmitting = isGranting || isRevoking

  const updateGrant = (
    roleId: string,
    updater: (
      grant: TemporaryAccessGrantDraft['grants'][number]
    ) => TemporaryAccessGrantDraft['grants'][number]
  ) => {
    const nextGrants = grants.map((grant) => (grant.roleId === roleId ? updater(grant) : grant))
    form.setValue('grants', nextGrants, { shouldDirty: true })
  }

  const handleSaveGrant = async (data: TemporaryAccessGrantDraft) => {
    if (!resolvedProjectRef) {
      toast.error('Select a project first')
      return
    }

    const roles = serializeDraftRolesForGrantMutation(data)
    if (roles.length === 0) return

    try {
      await ensureEnabled()
      await grantUserAccess({ projectRef: resolvedProjectRef, userId: data.memberId, roles })
      toast.success('Temporary database access saved')
      onCloseSheet()
    } catch (error) {
      toast.error(
        `Failed to save temporary access: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  const handleRevokeAccess = async () => {
    if (!resolvedProjectRef) return

    try {
      await revokeUserAccess({ projectRef: resolvedProjectRef, userId: memberId })
      toast.success('Temporary database access revoked')
      onCloseSheet()
    } catch (error) {
      toast.error(
        `Failed to revoke temporary access: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  useEffect(() => {
    if (initialProjectRef) setProjectRef(initialProjectRef)
  }, [initialProjectRef])

  useEffect(() => {
    if (open && isDataReady) {
      form.reset(defaultValues)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isDataReady, defaultValues])

  useEffect(() => {
    if (open) {
      form.setValue('memberId', memberId, { shouldDirty: false })
    }
  }, [form, memberId, open])

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          showClose={false}
          size="default"
          className="flex h-full w-full max-w-full flex-col gap-0 sm:w-[560px]! sm:max-w-[560px]"
        >
          <SheetHeader>
            <SheetTitle>Manage database access</SheetTitle>
            <SheetDescription>
              Configure temporary Postgres access for {memberLabel}.
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <ScrollArea className="flex-1 max-h-[calc(100vh-116px)]">
              <SheetSection className="space-y-8">
                <FormItemLayout layout="vertical" label="Project">
                  <OrganizationProjectSelector
                    fetchOnMount
                    sameWidthAsTrigger
                    checkPosition="left"
                    selectedRef={projectRef}
                    open={projectDropdownOpen}
                    setOpen={setProjectDropdownOpen}
                    searchPlaceholder="Search project..."
                    onSelect={(project) => {
                      setProjectRef(project.ref)
                      setParentProjectRef(project.parent_project_ref ?? null)
                    }}
                    onInitialLoad={(projects) => {
                      if (!projectRef && projects[0]) {
                        setProjectRef(projects[0].ref)
                        setParentProjectRef(projects[0].parent_project_ref ?? null)
                      }
                    }}
                  />
                </FormItemLayout>

                <FormItemLayout layout="vertical" label="Member">
                  <p className="text-sm text-foreground-light">{memberLabel}</p>
                </FormItemLayout>

                {!resolvedProjectRef ? (
                  <Admonition
                    type="note"
                    description="Select a project to configure database access."
                  />
                ) : (
                  <>
                    <TemporaryAccessProjectNotice
                      projectRef={resolvedProjectRef}
                      parentProjectRef={parentProjectRef}
                    />
                    <FormItemLayout
                      layout="vertical"
                      label="Postgres roles and settings"
                      description={
                        <>
                          Use{' '}
                          <InlineLink href={`${DOCS_URL}/guides/database/postgres/roles`}>
                            custom Postgres roles
                          </InlineLink>{' '}
                          with narrow permissions to reduce the impact of direct database access.
                          Custom roles need User can login enabled (Database → Roles) to appear
                          here.
                        </>
                      }
                    >
                      {grants.length === 0 ? (
                        <Admonition type="note" description="No assignable roles found." />
                      ) : (
                        <div className="overflow-hidden rounded-md border">
                          {grants.map((grant, index) => (
                            <div key={grant.roleId} className={index > 0 ? 'border-t' : ''}>
                              <TemporaryAccessGrantFields
                                control={form.control}
                                grantIndex={index}
                                role={{ id: grant.roleId, label: grant.roleId }}
                                grant={grant}
                                onChange={(next) => updateGrant(grant.roleId, () => next)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </FormItemLayout>
                  </>
                )}
              </SheetSection>
            </ScrollArea>
          </Form>

          <SheetFooter className="mt-auto w-full border-t py-4">
            {existingRule && (
              <Button
                variant="danger"
                onClick={handleRevokeAccess}
                loading={isRevoking}
                disabled={isGranting}
                className="mr-auto"
              >
                Revoke access
              </Button>
            )}
            <Button variant="default" onClick={confirmOnClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleSaveGrant)}
              loading={isGranting}
              disabled={!resolvedProjectRef || isRevoking}
            >
              {mode === 'edit' && existingRule ? 'Save access' : 'Grant access'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <DiscardChangesConfirmationDialog {...closeConfirmationModalProps} />
    </>
  )
}
