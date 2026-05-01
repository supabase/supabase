import { PermissionAction, SupportCategories } from '@supabase/shared-types/out/constants'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
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

import type { JitUserRule, SheetMode } from './JitDbAccess.types'
import {
  getAssignableJitRoleOptions,
  getJitMemberOptions,
  mapJitMembersToUserRules,
} from './JitDbAccess.utils'
import { JitDbAccessDeleteDialog } from './JitDbAccessDeleteDialog'
import { JitDbAccessRuleSheet } from './JitDbAccessRuleSheet'
import { JitDbAccessRulesTable } from './JitDbAccessRulesTable'
import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import AlertError from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { FeaturePreviewBadge } from '@/components/ui/FeaturePreviewBadge'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { useDatabaseRolesQuery } from '@/data/database-roles/database-roles-query'
import { useJitDbAccessMembersQuery } from '@/data/jit-db-access/jit-db-access-members-query'
import { useJitDbAccessQuery } from '@/data/jit-db-access/jit-db-access-query'
import { useJitDbAccessRevokeMutation } from '@/data/jit-db-access/jit-db-access-revoke-mutation'
import { useJitDbAccessUpdateMutation } from '@/data/jit-db-access/jit-db-access-update-mutation'
import { useOrganizationMembersQuery } from '@/data/organizations/organization-members-query'
import { useProjectMembersQuery } from '@/data/projects/project-members-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'

export const JitDbAccessConfiguration = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  const [enabled, setEnabled] = useState(false)
  const [, setShowCreateRuleSheet] = useQueryState('jit_new', parseAsBoolean.withDefault(false))
  const [ruleIdToEdit, setRuleIdToEdit] = useQueryState('jit_edit', parseAsString)
  const [showEnableJitDialog, setShowEnableJitDialog] = useState(false)
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<JitUserRule | null>(null)

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
    { resource: { project_id: project?.id } }
  )

  const { mutate: updateJitDbAccess, isPending: isUpdatingJitDbAccess } =
    useJitDbAccessUpdateMutation({
      onSuccess: (_, variables) => {
        const nextEnabled = variables.requestedConfig.state === 'enabled'

        if (nextEnabled) {
          toast.success('Temporary access enabled')
        } else {
          toast.success(
            activeRuleCount > 0
              ? `Temporary access disabled. ${activeRuleCount} configured member${activeRuleCount === 1 ? '' : 's'} can no longer request temporary database access.`
              : 'Temporary access disabled'
          )
        }
      },
      onError: (error) => {
        setEnabled(initialIsEnabled ?? false)
        toast.error(`Failed to update temporary access: ${error.message}`)
      },
    })

  const { mutate: revokeUserAccess, isPending: isRevokingAccess } = useJitDbAccessRevokeMutation({
    onSuccess: (_, variables) => {
      toast.success('Successfully revoked user access')
      setSelectedUserToDelete(null)
      if (ruleIdToEdit === variables.userId) resetSheetState()
    },
    onError: (error) => {
      toast.error(`Failed to revoke user access: ${error.message}`)
    },
  })

  const isMutating = isUpdatingJitDbAccess || isRevokingAccess
  const disableRuleActions = isMutating || isLoadingDatabaseRoles || isLoadingOrganizationMembers
  const isRulesLoading = isLoadingJitMembers || isLoadingProjectMembers

  const initialIsEnabled =
    jitDbAccessConfiguration?.state === 'enabled'
      ? jitDbAccessConfiguration?.appliedSuccessfully
      : false
  const isJitDbAccessUnavailable = jitDbAccessConfiguration?.state === 'unavailable'
  const unavailableReason = isJitDbAccessUnavailable
    ? jitDbAccessConfiguration.unavailableReason
    : undefined

  const roleOptions = useMemo(() => getAssignableJitRoleOptions(databaseRoles), [databaseRoles])

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

  const activeRuleCount = useMemo(
    () => users.filter((user) => user.status.active > 0).length,
    [users]
  )

  const resetSheetState = () => {
    setShowCreateRuleSheet(false)
    setRuleIdToEdit(null)
  }

  const submitJitToggle = (nextEnabled: boolean) => {
    if (!ref) return console.error('Project ref is required')

    setEnabled(nextEnabled)
    updateJitDbAccess({
      projectRef: ref,
      requestedConfig: { state: nextEnabled ? 'enabled' : 'disabled' },
    })
  }

  const handleJitToggleChange = (checked: boolean) => {
    if (isJitDbAccessUnavailable || !canUpdateJitDbAccess) return

    if (checked && !enabled) {
      if (activeRuleCount > 0) {
        return setShowEnableJitDialog(true)
      }
      return submitJitToggle(true)
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
    setRuleIdToEdit(null)
    setShowCreateRuleSheet(true)
  }

  const openEditRuleSheet = (user: JitUserRule) => {
    if (!canUpdateJitDbAccess) return
    setShowCreateRuleSheet(false)
    setRuleIdToEdit(user.id)
  }

  const openDeleteDialog = (user: JitUserRule) => {
    if (!canUpdateJitDbAccess) return
    setSelectedUserToDelete(user)
  }

  const handleConfirmDelete = () => {
    if (!ref) return console.error('Project ref is required')
    if (!selectedUserToDelete) return toast.error('User is required')
    revokeUserAccess({ projectRef: ref, userId: selectedUserToDelete.memberId })
  }

  const switchDisabled = isLoadingConfiguration || isUpdatingJitDbAccess || !canUpdateJitDbAccess
  const switchTooltipText = !canUpdateJitDbAccess ? 'Additional permissions required' : undefined

  const showToggleFailedWarning =
    isSuccessConfiguration &&
    jitDbAccessConfiguration?.state !== 'unavailable' &&
    !jitDbAccessConfiguration.appliedSuccessfully

  const projectReference = ref ? (
    <>
      This project <code className="text-code-inline">{ref}</code>
    </>
  ) : (
    'This project'
  )
  const unavailableTitle =
    unavailableReason === 'postgres_upgrade_required'
      ? 'Postgres upgrade required'
      : unavailableReason === 'manual_migration_required'
        ? 'Migration required'
        : 'Temporary access unavailable'
  const unavailableDescription =
    unavailableReason === 'postgres_upgrade_required'
      ? 'must be upgraded to Postgres 17 or later before temporary access can be enabled.'
      : unavailableReason === 'manual_migration_required'
        ? 'must be migrated before temporary access can be enabled. Contact support to migrate this project.'
        : 'This feature is currently unavailable for this project. Contact support if you need help enabling it.'

  useEffect(() => {
    if (!isLoadingConfiguration && jitDbAccessConfiguration) {
      setEnabled(initialIsEnabled ?? false)
    }
  }, [initialIsEnabled, isLoadingConfiguration, jitDbAccessConfiguration])

  return (
    <>
      <PageSection id="jit-db-access-configuration">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>
              <span className="flex items-center gap-x-4">
                Temporary access
                <FeaturePreviewBadge featureKey={LOCAL_STORAGE_KEYS.UI_PREVIEW_JIT_DB_ACCESS} />
              </span>
            </PageSectionTitle>
          </PageSectionSummary>
          <DocsButton href={`${DOCS_URL}/guides/platform/temporary-access`} />
        </PageSectionMeta>

        <PageSectionContent className="space-y-4">
          {isErrorJitDbAccessConfiguration && (
            <AlertError
              projectRef={ref}
              subject="Failed to load temporary access"
              error={jitDbAccessConfigurationError as { message: string } | null}
              showInstructions={false}
            />
          )}

          {!isErrorJitDbAccessConfiguration && isJitDbAccessUnavailable && (
            <Admonition
              type="note"
              layout="responsive"
              title={unavailableTitle}
              description={
                unavailableReason === 'temporarily_unavailable' ? (
                  unavailableDescription
                ) : (
                  <>
                    {projectReference} {unavailableDescription}
                  </>
                )
              }
              actions={
                unavailableReason === 'postgres_upgrade_required' && ref ? (
                  <Button type="default" asChild>
                    <Link href={`/project/${ref}/settings/infrastructure`}>Upgrade Postgres</Link>
                  </Button>
                ) : (
                  <Button type="default" asChild>
                    <SupportLink
                      queryParams={{
                        category: SupportCategories.PROBLEM,
                        projectRef: ref,
                        subject: unavailableTitle,
                      }}
                    >
                      Contact support
                    </SupportLink>
                  </Button>
                )
              }
            />
          )}

          {!isErrorJitDbAccessConfiguration && !isJitDbAccessUnavailable && (
            <Card>
              <CardContent className="space-y-4">
                <FormLayout
                  layout="flex-row-reverse"
                  label="Allow temporary access"
                  description="Let project members request temporary database access."
                >
                  <div className="flex w-fit shrink-0 items-center justify-end gap-2">
                    {(isLoadingConfiguration || isUpdatingJitDbAccess) && (
                      <Loader2
                        className="animate-spin text-foreground-muted/50"
                        strokeWidth={2}
                        size={16}
                      />
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {/* [Joshen] Added div as tooltip is messing with data state property of toggle */}
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
              </CardContent>
              {showToggleFailedWarning && (
                <Admonition
                  type="warning"
                  layout="horizontal"
                  title="Temporary access update didn’t apply"
                  description={
                    <>
                      The change didn’t apply. Try enabling or disabling temporary access again, or{' '}
                      <SupportLink
                        queryParams={{
                          category: SupportCategories.DASHBOARD_BUG,
                          subject: 'Temporary access was not updated successfully',
                        }}
                        className={InlineLinkClassName}
                      >
                        contact support
                      </SupportLink>{' '}
                      if the issue persists.
                    </>
                  }
                  className="mb-0 rounded-none border-0"
                />
              )}
            </Card>
          )}

          {enabled && !isJitDbAccessUnavailable && !isUpdatingJitDbAccess && (
            <>
              {isErrorJitMembers && (
                <AlertError
                  projectRef={ref}
                  subject="Failed to load temporary access rules"
                  error={jitMembersError as { message: string } | null}
                  showInstructions={false}
                />
              )}

              <JitDbAccessRulesTable
                users={users}
                isLoading={isRulesLoading}
                canUpdate={!!canUpdateJitDbAccess}
                disableActions={disableRuleActions}
                allProjectMembersHaveRules={availableMembersForAdd.length === 0}
                onAddRule={openAddRuleSheet}
                onEditRule={openEditRuleSheet}
                onDeleteRule={openDeleteDialog}
              />
            </>
          )}
        </PageSectionContent>
      </PageSection>

      <JitDbAccessRuleSheet
        memberOptions={memberOptionsForSheet}
        membersWithRules={membersWithRules}
        availableMembersForAddCount={availableMembersForAdd.length}
      />

      <JitDbAccessDeleteDialog
        user={selectedUserToDelete}
        isDeleting={isRevokingAccess}
        onClose={() => setSelectedUserToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <AlertDialog open={showEnableJitDialog} onOpenChange={setShowEnableJitDialog}>
        <AlertDialogContent size="small">
          <AlertDialogHeader>
            <AlertDialogTitle>This will activate existing rules</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm">
                <p>
                  Enabling temporary access will allow {activeRuleCount} pre-configured member
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
              Enable temporary access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
