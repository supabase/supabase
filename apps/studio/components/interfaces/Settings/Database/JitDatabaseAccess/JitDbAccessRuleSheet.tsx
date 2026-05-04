import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Form,
  FormControl,
  FormField,
  ScrollArea,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import type {
  JitExpiryMode,
  JitMemberOption,
  JitUserRuleDraft,
  SheetMode,
} from './JitDbAccess.types'
import {
  createDraft,
  draftFromRule,
  getAssignableJitRoleOptions,
  getInvalidIpRangeRows,
  mapJitMembersToUserRules,
  serializeDraftRolesForGrantMutation,
} from './JitDbAccess.utils'
import { JitDbAccessRoleGrantFields } from './JitDbAccessRoleGrantFields'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { InlineLink } from '@/components/ui/InlineLink'
import { useDatabaseRolesQuery } from '@/data/database-roles/database-roles-query'
import { useJitDbAccessGrantMutation } from '@/data/jit-db-access/jit-db-access-grant-mutation'
import { useJitDbAccessMembersQuery } from '@/data/jit-db-access/jit-db-access-members-query'
import { useProjectMembersQuery } from '@/data/projects/project-members-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { DOCS_URL } from '@/lib/constants'

const grantSchema = z.object({
  roleId: z.string(),
  enabled: z.boolean(),
  expiryMode: z.custom<JitExpiryMode>(),
  hasExpiry: z.boolean(),
  expiry: z.string(),
  ipRanges: z.array(z.object({ value: z.string() })),
})

function createJitRuleSchema(mode: SheetMode, membersWithRules: Set<string>) {
  return z
    .object({
      memberId: z.string().min(1, 'Select a member for this temporary access rule.'),
      grants: z.array(grantSchema),
    })
    .superRefine((data, ctx) => {
      if (mode === 'add' && membersWithRules.has(data.memberId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['memberId'],
          message:
            'This member already has a temporary access rule. Edit their existing rule from the list.',
        })
      }

      const enabledGrantCount = data.grants.filter((g) => g.enabled).length
      if (enabledGrantCount === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['grants'],
          message: 'Select at least one role.',
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

interface JitDbAccessRuleSheetProps {
  memberOptions: JitMemberOption[]
  membersWithRules: Set<string>
  availableMembersForAddCount: number
}

/**
 * [Joshen] Form schema can be further refactored to simplify
 * It's weird that we're rendering the role options based on the form, when it's just based on
 * the available database roles - should decouple
 */

export function JitDbAccessRuleSheet({
  memberOptions,
  membersWithRules,
  availableMembersForAddCount,
}: JitDbAccessRuleSheetProps) {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [isNewRule, setIsNewRule] = useQueryState('jit_new', parseAsBoolean.withDefault(false))
  const [ruleIdToEdit, setRuleIdToEdit] = useQueryState('jit_edit', parseAsString)

  const { data: databaseRoles, isSuccess: isSuccessDatabaseRoles } = useDatabaseRolesQuery({
    projectRef,
    connectionString: project?.connectionString,
  })
  const roleOptions = useMemo(() => getAssignableJitRoleOptions(databaseRoles), [databaseRoles])
  const roleIds = useMemo(() => roleOptions.map((role) => role.id), [roleOptions])

  const { data: jitMembers, isSuccess: isSuccessJitMembers } = useJitDbAccessMembersQuery({
    projectRef,
  })
  const { data: projectMembers, isSuccess: isSuccessProjectMembers } = useProjectMembersQuery({
    projectRef,
  })
  const users = useMemo(
    () => mapJitMembersToUserRules(jitMembers, projectMembers, roleOptions),
    [jitMembers, projectMembers, roleOptions]
  )
  const user = users.find((x) => x.id === ruleIdToEdit)
  const mode: SheetMode = !!user ? 'edit' : 'add'

  const isDataReady = isSuccessDatabaseRoles && isSuccessJitMembers && isSuccessProjectMembers
  const open = isNewRule || (!!ruleIdToEdit && !!user)

  const defaultValues = !isNewRule && !!user ? draftFromRule(user, roleIds) : createDraft(roleIds)
  const FormSchema = useMemo(
    () => createJitRuleSchema(mode, membersWithRules),
    [mode, membersWithRules]
  )
  const form = useForm<JitUserRuleDraft>({
    defaultValues,
    resolver: zodResolver(FormSchema),
  })
  const grants = form.watch('grants')

  const onCloseSheet = () => {
    setIsNewRule(false)
    setRuleIdToEdit(null)
  }

  const {
    confirmOnClose,
    handleOpenChange,
    modalProps: closeConfirmationModalProps,
  } = useConfirmOnClose({
    checkIsDirty: () => form.formState.isDirty,
    onClose: onCloseSheet,
  })

  const { mutate: grantUserAccess, isPending: isSubmitting } = useJitDbAccessGrantMutation({
    onSuccess: () => {
      toast.success(
        mode === 'edit' ? 'Successfully updated user access' : 'Successfully granted user access'
      )
      onCloseSheet()
    },
    onError: (error) => {
      toast.error(`Failed to ${mode === 'edit' ? 'update' : 'grant'} user access: ${error.message}`)
    },
  })

  const updateGrant = (
    roleId: string,
    updater: (grant: JitUserRuleDraft['grants'][number]) => JitUserRuleDraft['grants'][number]
  ) => {
    const nextGrants = grants.map((grant) => (grant.roleId === roleId ? updater(grant) : grant))
    form.setValue('grants', nextGrants, { shouldDirty: true })
  }

  const handleSaveRule = (data: z.infer<typeof FormSchema>) => {
    if (!projectRef) return console.error('Project ref is required')

    const roles = serializeDraftRolesForGrantMutation(data)
    if (roles.length === 0) return

    grantUserAccess({ projectRef, userId: data.memberId, roles })
  }

  useEffect(() => {
    if (!!ruleIdToEdit && isDataReady && !user) {
      toast('Access rule cannot be found')
      setRuleIdToEdit(null)
    }
  }, [isDataReady, ruleIdToEdit, setRuleIdToEdit, user])

  useEffect(() => {
    if (open && isDataReady) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isDataReady])

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          showClose={false}
          size="default"
          className="flex h-full w-full max-w-full flex-col gap-0 sm:w-[560px]! sm:max-w-[560px]"
        >
          <SheetHeader>
            <SheetTitle>
              {mode === 'edit' ? 'Edit temporary access rule' : 'New temporary access rule'}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Configure which database roles a user can request with temporary access.
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <ScrollArea className="flex-1 max-h-[calc(100vh-116px)]">
              <div className="space-y-8 px-5 py-6 sm:px-6">
                <FormField
                  control={form.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItemLayout layout="vertical" label="Member">
                      <FormControl>
                        <Select_Shadcn_
                          value={field.value}
                          disabled={
                            mode === 'edit' || (mode === 'add' && availableMembersForAddCount === 0)
                          }
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger_Shadcn_>
                            <SelectValue_Shadcn_ placeholder="Select a member" />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            {memberOptions.map((member) => (
                              <SelectItem_Shadcn_ key={member.id} value={member.id}>
                                {member.name ? (
                                  <>
                                    {member.name}{' '}
                                    <span className="text-foreground-lighter">
                                      ({member.email})
                                    </span>
                                  </>
                                ) : (
                                  member.email
                                )}
                              </SelectItem_Shadcn_>
                            ))}
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </FormControl>

                      {mode === 'add' && availableMembersForAddCount === 0 && (
                        <p className="mt-2 text-foreground-lighter">
                          All project members already have temporary access rules. Edit an existing
                          rule from the table above.
                        </p>
                      )}
                    </FormItemLayout>
                  )}
                />

                <FormField
                  control={form.control}
                  name="grants"
                  render={() => (
                    <FormItemLayout
                      layout="vertical"
                      label="Roles and settings"
                      description={
                        <>
                          Use{' '}
                          <InlineLink
                            href={`${DOCS_URL}/guides/database/postgres/roles`}
                            className="decoration-foreground-muted"
                          >
                            custom Postgres roles
                          </InlineLink>{' '}
                          with narrow permissions to reduce the impact of direct database access.
                        </>
                      }
                    >
                      {grants.length === 0 ? (
                        <Admonition
                          type="note"
                          description="No assignable roles found."
                          className="bg-background"
                        />
                      ) : (
                        <div className="overflow-hidden rounded-md border">
                          {grants.map((grant, index) => (
                            <div key={grant.roleId} className={index > 0 ? 'border-t' : ''}>
                              <JitDbAccessRoleGrantFields
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
                  )}
                />
              </div>
            </ScrollArea>
          </Form>

          <SheetFooter className="mt-auto w-full border-t py-4">
            <Button type="default" onClick={confirmOnClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={form.handleSubmit(handleSaveRule)}
              loading={isSubmitting}
            >
              {mode === 'edit' ? 'Save rule' : 'Create rule'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <DiscardChangesConfirmationDialog {...closeConfirmationModalProps} />
    </>
  )
}
