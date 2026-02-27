import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import { useJitDbAccessGrantMutation } from 'data/jit-db-access/jit-db-access-grant-mutation'
import { useJitDbAccessMembersQuery } from 'data/jit-db-access/jit-db-access-members-query'
import { useJitDbAccessQuery } from 'data/jit-db-access/jit-db-access-query'
import { useJitDbAccessRevokeMutation } from 'data/jit-db-access/jit-db-access-revoke-mutation'
import { useJitDbAccessUpdateMutation } from 'data/jit-db-access/jit-db-access-update-mutation'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useProjectMembersQuery } from 'data/projects/project-members-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Alert,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  CardContent,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns'
import { Admonition } from 'ui-patterns/admonition'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'

import type { JitUserRule, SheetMode } from './jitDbAccess.types'
import {
  createDraft,
  draftFromRule,
  getAssignableJitRoleOptions,
  getJitMemberOptions,
  mapJitMembersToUserRules,
  serializeDraftRolesForGrantMutation,
} from './jitDbAccess.utils'
import { JitDbAccessDeleteDialog } from './JitDbAccessDeleteDialog'
import { JitDbAccessRuleSheet } from './JitDbAccessRuleSheet'
import { JitDbAccessRulesTable } from './JitDbAccessRulesTable'

const JitDbAccessConfiguration = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  const [enabled, setEnabled] = useState(false)
  const [showCreateRuleSheet, setShowCreateRuleSheet] = useQueryState(
    'jit_new',
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  )
  const [ruleIdToEdit, setRuleIdToEdit] = useQueryState('jit_edit', parseAsString)
  const [showInlineValidation, setShowInlineValidation] = useState(false)
  const [showEnableJitDialog, setShowEnableJitDialog] = useState(false)
  const [userPendingDelete, setUserPendingDelete] = useState<JitUserRule | null>(null)
  const [draft, setDraft] = useState(() => createDraft([]))

  const {
    data: jitDbAccessConfiguration,
    error: jitDbAccessConfigurationError,
    isError: isErrorJitDbAccessConfiguration,
    isLoading: isLoadingConfiguration,
    isSuccess: isSuccessConfiguration,
  } = useJitDbAccessQuery({ projectRef: ref })

  const {
    data: jitMembers,
    error: jitMembersError,
    isError: isErrorJitMembers,
    isLoading: isLoadingJitMembers,
  } = useJitDbAccessMembersQuery({ projectRef: ref })

  const { data: projectMembers, isLoading: isLoadingProjectMembers } = useProjectMembersQuery({
    projectRef: ref,
  })

  const { data: organizationMembers, isLoading: isLoadingOrganizationMembers } =
    useOrganizationMembersQuery({ slug: organization?.slug })

  const { data: databaseRoles, isLoading: isLoadingDatabaseRoles } = useDatabaseRolesQuery({
    projectRef: ref,
    connectionString: project?.connectionString,
  })

  const { can: canUpdateJitDbAccess } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

  const initialIsEnabled =
    isSuccessConfiguration &&
    !!jitDbAccessConfiguration &&
    jitDbAccessConfiguration.appliedSuccessfully &&
    jitDbAccessConfiguration.state === 'enabled'

  const hasAccessToJitDbAccess = !(
    jitDbAccessConfiguration !== undefined &&
    'isUnavailable' in jitDbAccessConfiguration &&
    jitDbAccessConfiguration.isUnavailable
  )

  useEffect(() => {
    if (!isLoadingConfiguration && jitDbAccessConfiguration) {
      setEnabled(initialIsEnabled)
    }
  }, [initialIsEnabled, isLoadingConfiguration, jitDbAccessConfiguration])

  const roleOptions = useMemo(() => getAssignableJitRoleOptions(databaseRoles), [databaseRoles])
  const roleIds = useMemo(() => roleOptions.map((role) => role.id), [roleOptions])

  const users = useMemo(
    () => mapJitMembersToUserRules(jitMembers, projectMembers, roleOptions),
    [jitMembers, projectMembers, roleOptions]
  )

  const allMembers = useMemo(
    () => getJitMemberOptions(organizationMembers, projectMembers),
    [organizationMembers, projectMembers]
  )

  const editingUser = useMemo(
    () => users.find((user) => user.id === ruleIdToEdit) ?? null,
    [users, ruleIdToEdit]
  )

  const sheetOpen = showCreateRuleSheet || !!ruleIdToEdit
  const sheetMode: SheetMode = ruleIdToEdit ? 'edit' : 'add'

  const membersWithRules = useMemo(() => new Set(users.map((user) => user.memberId)), [users])

  const availableMembersForAdd = useMemo(
    () => allMembers.filter((member) => !membersWithRules.has(member.id)),
    [allMembers, membersWithRules]
  )

  const memberOptionsForSheet = useMemo(() => {
    if (sheetMode !== 'edit') return availableMembersForAdd
    if (!editingUser) return allMembers

    if (allMembers.some((member) => member.id === editingUser.memberId)) return allMembers

    return [
      {
        id: editingUser.memberId,
        email: editingUser.email,
        name: editingUser.name,
      },
      ...allMembers,
    ]
  }, [sheetMode, availableMembersForAdd, allMembers, editingUser])

  const isDuplicateSelectedMember =
    sheetMode === 'add' && draft.memberId !== '' && membersWithRules.has(draft.memberId)

  const enabledRoleCount = useMemo(
    () => draft.grants.filter((grant) => grant.enabled).length,
    [draft.grants]
  )

  const activeRuleCount = useMemo(
    () => users.filter((user) => user.status.active > 0).length,
    [users]
  )

  const inlineValidation = useMemo(
    () => ({
      member: !draft.memberId
        ? 'Select a member for this JIT access rule.'
        : isDuplicateSelectedMember
          ? 'This member already has a JIT access rule. Edit their existing rule from the list.'
          : undefined,
      roles: enabledRoleCount > 0 ? undefined : 'Select at least one role.',
    }),
    [draft.memberId, enabledRoleCount, isDuplicateSelectedMember]
  )

  const resetSheetState = () => {
    void setShowCreateRuleSheet(false)
    void setRuleIdToEdit(null)
    setShowInlineValidation(false)
  }

  const closeSheet = () => {
    resetSheetState()
  }

  const submitJitToggle = (nextEnabled: boolean) => {
    if (!ref) {
      console.error('Project ref is required')
      return
    }

    setEnabled(nextEnabled)

    updateJitDbAccess({
      projectRef: ref,
      requestedConfig: { state: nextEnabled ? 'enabled' : 'disabled' },
    })
  }

  const { mutate: updateJitDbAccess, isPending: isUpdatingJitDbAccess } =
    useJitDbAccessUpdateMutation({
      onSuccess: (_, variables) => {
        const nextEnabled = variables.requestedConfig.state === 'enabled'

        if (nextEnabled) {
          toast.success('JIT access enabled')
        } else {
          toast.success(
            activeRuleCount > 0
              ? `JIT access disabled. ${activeRuleCount} configured member${activeRuleCount === 1 ? '' : 's'} can no longer request temporary database access.`
              : 'JIT access disabled.'
          )
        }
      },
      onError: (error) => {
        setEnabled(initialIsEnabled)
        toast.error(`Failed to update just-in-time (JIT) database access: ${error.message}`)
      },
    })

  const { mutate: grantUserAccess, isPending: isGrantingAccess } = useJitDbAccessGrantMutation({
    onSuccess: () => {
      toast.success(
        sheetMode === 'edit'
          ? 'Successfully updated user access'
          : 'Successfully granted user access'
      )
      resetSheetState()
    },
    onError: (error) => {
      toast.error(
        `Failed to ${sheetMode === 'edit' ? 'update' : 'grant'} user access: ${error.message}`
      )
    },
  })

  const { mutate: revokeUserAccess, isPending: isRevokingAccess } = useJitDbAccessRevokeMutation({
    onSuccess: (_, variables) => {
      toast.success('Successfully revoked user access')
      setUserPendingDelete(null)

      if (ruleIdToEdit === variables.userId) {
        resetSheetState()
      }
    },
    onError: (error) => {
      toast.error(`Failed to revoke user access: ${error.message}`)
    },
  })

  const isMutating = isUpdatingJitDbAccess || isGrantingAccess || isRevokingAccess
  const disableRuleActions = isMutating || isLoadingDatabaseRoles || isLoadingOrganizationMembers
  const isRulesLoading = isLoadingJitMembers || isLoadingProjectMembers

  const handleJitToggleChange = (checked: boolean) => {
    if (!hasAccessToJitDbAccess || !canUpdateJitDbAccess) return

    if (checked && !enabled) {
      if (activeRuleCount > 0) {
        setShowEnableJitDialog(true)
        return
      }

      submitJitToggle(true)
      return
    }

    if (!checked && enabled) {
      submitJitToggle(false)
    }
  }

  const handleConfirmEnableJit = () => {
    setShowEnableJitDialog(false)
    submitJitToggle(true)
  }

  const openAddRuleSheet = () => {
    if (!canUpdateJitDbAccess) return

    void setRuleIdToEdit(null)
    setDraft(createDraft(roleIds))
    setShowInlineValidation(false)
    void setShowCreateRuleSheet(true)
  }

  const openEditRuleSheet = (user: JitUserRule) => {
    if (!canUpdateJitDbAccess) return

    void setShowCreateRuleSheet(false)
    void setRuleIdToEdit(user.id)
    setDraft(draftFromRule(user, roleIds))
    setShowInlineValidation(false)
  }

  const openDeleteDialog = (user: JitUserRule) => {
    if (!canUpdateJitDbAccess) return
    setUserPendingDelete(user)
  }

  const handleSaveRule = () => {
    setShowInlineValidation(true)
    if (inlineValidation.member || inlineValidation.roles) return

    if (!ref) {
      console.error('Project ref is required')
      return
    }

    const roles = serializeDraftRolesForGrantMutation(draft)
    if (roles.length === 0) return

    grantUserAccess({
      projectRef: ref,
      userId: draft.memberId,
      roles,
    })
  }

  const handleConfirmDelete = () => {
    if (!ref || !userPendingDelete) {
      if (!ref) console.error('Project ref is required')
      return
    }

    revokeUserAccess({
      projectRef: ref,
      userId: userPendingDelete.memberId,
    })
  }

  const switchDisabled =
    isLoadingConfiguration ||
    isUpdatingJitDbAccess ||
    !canUpdateJitDbAccess ||
    !hasAccessToJitDbAccess

  const switchTooltipText = !canUpdateJitDbAccess
    ? 'You need additional permissions to update JIT database access for your project.'
    : !hasAccessToJitDbAccess
      ? 'Your project does not have access to JIT database access. Please update to the latest Postgres version.'
      : undefined

  useEffect(() => {
    if (!ruleIdToEdit || isLoadingJitMembers || isLoadingProjectMembers || editingUser) return

    toast('JIT access rule not found')
    void setRuleIdToEdit(null)
  }, [editingUser, isLoadingJitMembers, isLoadingProjectMembers, ruleIdToEdit, setRuleIdToEdit])

  return (
    <>
      <PageSection id="jit-db-access-configuration">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Just-in-Time (JIT)</PageSectionTitle>
          </PageSectionSummary>
          <DocsButton href={`${DOCS_URL}/guides/platform/just-in-time-database-access`} />
        </PageSectionMeta>

        <PageSectionContent className="space-y-4">
          {isErrorJitDbAccessConfiguration && (
            <AlertError
              projectRef={ref}
              subject="Failed to retrieve JIT database access configuration"
              error={jitDbAccessConfigurationError as { message: string } | null}
            />
          )}

          <Card>
            <CardContent className="space-y-4">
              <FormLayout
                layout="flex-row-reverse"
                label="Enable JIT access"
                description="Allow configured project members to request temporary database access."
              >
                <div className="flex w-fit flex-shrink-0 items-center justify-end gap-2">
                  {(isLoadingConfiguration || isUpdatingJitDbAccess) && (
                    <Loader2 className="animate-spin" strokeWidth={1.5} size={16} />
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Switch
                          size="large"
                          checked={enabled}
                          onCheckedChange={handleJitToggleChange}
                          disabled={switchDisabled}
                        />
                      </div>
                    </TooltipTrigger>
                    {switchTooltipText && (
                      <TooltipContent side="bottom">{switchTooltipText}</TooltipContent>
                    )}
                  </Tooltip>
                </div>
              </FormLayout>

              {isSuccessConfiguration && !jitDbAccessConfiguration?.appliedSuccessfully && (
                <Alert withIcon variant="warning" title="JIT access was not updated successfully">
                  Please try updating again, or contact support if this error persists
                </Alert>
              )}
            </CardContent>
          </Card>

          {!hasAccessToJitDbAccess && (
            <Admonition
              type="note"
              layout="vertical"
              title="Postgres upgrade required"
              description="Just-in-time access requires a newer Postgres version. Upgrade your project to enable JIT access."
              actions={
                ref ? (
                  <Button type="default" asChild>
                    <Link href={`/project/${ref}/settings/infrastructure`}>Upgrade Postgres</Link>
                  </Button>
                ) : undefined
              }
            />
          )}

          {enabled && hasAccessToJitDbAccess && (
            <>
              {isErrorJitMembers && (
                <AlertError
                  projectRef={ref}
                  subject="Failed to retrieve JIT access rules"
                  error={jitMembersError as { message: string } | null}
                />
              )}

              <JitDbAccessRulesTable
                users={users}
                isLoading={isRulesLoading}
                canUpdate={!!canUpdateJitDbAccess}
                disableActions={disableRuleActions}
                onAddRule={openAddRuleSheet}
                onEditRule={openEditRuleSheet}
                onDeleteRule={openDeleteDialog}
              />
            </>
          )}
        </PageSectionContent>
      </PageSection>

      <JitDbAccessRuleSheet
        open={sheetOpen}
        mode={sheetMode}
        draft={draft}
        editingUser={editingUser}
        memberOptions={memberOptionsForSheet}
        availableMembersForAddCount={availableMembersForAdd.length}
        showInlineValidation={showInlineValidation}
        inlineValidation={inlineValidation}
        isSubmitting={isGrantingAccess}
        onDraftChange={setDraft}
        onCancel={closeSheet}
        onSave={handleSaveRule}
        onRequestDelete={() => {
          if (editingUser) openDeleteDialog(editingUser)
        }}
      />

      <JitDbAccessDeleteDialog
        user={userPendingDelete}
        open={userPendingDelete !== null}
        isDeleting={isRevokingAccess}
        onOpenChange={(open) => {
          if (!open) setUserPendingDelete(null)
        }}
        onConfirm={handleConfirmDelete}
      />

      <AlertDialog open={showEnableJitDialog} onOpenChange={setShowEnableJitDialog}>
        <AlertDialogContent size="small">
          <AlertDialogHeader>
            <AlertDialogTitle>JIT access will activate existing rules</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm">
                <p>
                  Enabling JIT will allow {activeRuleCount} configured member
                  {activeRuleCount === 1 ? '' : 's'} to request temporary database access
                  immediately.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingJitDbAccess}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="warning"
              disabled={isUpdatingJitDbAccess}
              onClick={handleConfirmEnableJit}
            >
              Enable JIT access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default JitDbAccessConfiguration
