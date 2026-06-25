import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { UserPlus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  ExpandingTextArea,
  Form,
  FormControl,
  FormField,
  FormItem,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  SheetTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import {
  BatchInvitationResult,
  buildProjectPayloadFromAccessScope,
  buildSsoPayload,
  categorizeInviteEmails,
  emailSchema,
  parseEmails,
} from './InviteMemberButton.utils'
import { ROLE_DESCRIPTIONS } from './Roles.constants'
import {
  ALL_PROJECTS_ACCESS_SCOPE,
  ALL_PROJECTS_ACCESS_SCOPE_LABEL,
  roleRequiresOrgWideAccess,
  type TeamAccessScopeSelection,
} from './TeamAccessScope.utils'
import { TeamAccessScopeSelector } from './TeamAccessScopeSelector'
import { TeamProjectScopeRadioGroup } from './TeamProjectScopeRadioGroup'
import { useGetRolesManagementPermissions } from './TeamSettings.utils'
import { useIsJitDbAccessEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import type { TemporaryAccessGrantDraft } from '@/components/interfaces/TemporaryAccess/TemporaryAccess.types'
import {
  buildPendingInvitationAccessGrant,
  createInviteGuestGrantDraft,
  EXTERNAL_COLLABORATOR_ROLE_DESCRIPTION,
  EXTERNAL_COLLABORATOR_ROLE_ID,
  EXTERNAL_COLLABORATOR_ROLE_NAME,
  isExternalCollaboratorRole,
  resolveExternalCollaboratorInviteRole,
  resolveExternalCollaboratorInviteRoleForProject,
  validateGuestAccessGrants,
} from '@/components/interfaces/TemporaryAccess/TemporaryAccessInvite.utils'
import { TemporaryAccessInviteGrantSection } from '@/components/interfaces/TemporaryAccess/TemporaryAccessInviteGrantSection'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { InlineLink } from '@/components/ui/InlineLink'
import { OrganizationProjectSelector } from '@/components/ui/OrganizationProjectSelector'
import { Shortcut } from '@/components/ui/Shortcut'
import { useOrganizationCreateInvitationMutation } from '@/data/organization-members/organization-invitation-create-mutation'
import { useOrganizationRolesV2Query } from '@/data/organization-members/organization-roles-query'
import { useOrganizationMembersQuery } from '@/data/organizations/organization-members-query'
import { useOrgSSOConfigQuery } from '@/data/sso/sso-config-query'
import { useHasAccessToProjectLevelPermissions } from '@/data/subscriptions/org-subscription-query'
import { doPermissionsCheck, useGetPermissions } from '@/hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { DOCS_URL } from '@/lib/constants'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { useProfile } from '@/lib/profile'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

const accessScopeSchema = z.union([
  z.literal(ALL_PROJECTS_ACCESS_SCOPE),
  z.array(z.string()).min(1, 'Select at least one project'),
])

type InviteMemberFormValues = {
  email: string
  role: string
  accessScope: TeamAccessScopeSelection
  projectRef: string
  guestAccess: TemporaryAccessGrantDraft
  requireSso: 'auto' | 'sso' | 'non-sso'
}

export const InviteMemberButton = () => {
  const { slug } = useParams()
  const { profile } = useProfile()
  const { data: organization } = useSelectedOrganizationQuery()
  const { permissions: permissions } = useGetPermissions()

  const { organizationMembersCreate: organizationMembersCreationEnabled } = useIsFeatureEnabled([
    'organization_members:create',
  ])
  const isJitDbAccessEnabled = useIsJitDbAccessEnabled()

  const [isOpen, setIsOpen] = useState(false)
  const [accessScopeDropdownOpen, setAccessScopeDropdownOpen] = useState(false)
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
  const [guestParentProjectRef, setGuestParentProjectRef] = useState<string | null>(null)

  const { data: members } = useOrganizationMembersQuery({ slug })
  const { data: allRoles, isSuccess: isRolesSuccess } = useOrganizationRolesV2Query({ slug })
  const orgScopedRoles = allRoles?.org_scoped_roles ?? []

  const externalCollaboratorInviteRole = useMemo(
    () => resolveExternalCollaboratorInviteRole(allRoles),
    [allRoles]
  )

  const { data: ssoConfig } = useOrgSSOConfigQuery({ orgSlug: slug })
  const hasSsoProvider = !!ssoConfig && ssoConfig !== null

  const defaultValues: InviteMemberFormValues = {
    email: '',
    role: orgScopedRoles.find((role) => role.name === 'Developer')?.id.toString() ?? '',
    accessScope: ALL_PROJECTS_ACCESS_SCOPE,
    projectRef: '',
    guestAccess: createInviteGuestGrantDraft([]),
    requireSso: 'auto',
  }

  const hasAccessToProjectLevelPermissions = useHasAccessToProjectLevelPermissions(slug as string)

  const userMemberData = members?.find((m) => m.gotrue_id === profile?.gotrue_id)
  const hasOrgRole =
    (userMemberData?.role_ids ?? []).length === 1 &&
    orgScopedRoles.some((r) => r.id === userMemberData?.role_ids[0])

  const isStripeProjectsOrg = organization?.managed_by === MANAGED_BY.STRIPE_PROJECTS

  const { rolesAddable } = useGetRolesManagementPermissions(
    organization?.slug,
    orgScopedRoles,
    permissions ?? []
  )

  const canInviteMembers =
    hasOrgRole &&
    rolesAddable.length > 0 &&
    orgScopedRoles.some(({ id: role_id }) =>
      doPermissionsCheck(
        permissions,
        PermissionAction.CREATE,
        'user_invites',
        { resource: { role_id } },
        organization?.slug
      )
    )

  const externalCollaboratorDisabledReason = useMemo(() => {
    if (!canInviteMembers) {
      return 'You need additional permissions to invite members'
    }
    if (isRolesSuccess && !externalCollaboratorInviteRole) {
      return 'External collaborator invites are not available for this organization'
    }
    return undefined
  }, [canInviteMembers, externalCollaboratorInviteRole, isRolesSuccess])

  const isExternalCollaboratorDisabled =
    !!externalCollaboratorDisabledReason || (!isRolesSuccess && isJitDbAccessEnabled)

  const { mutateAsync: inviteMemberAsync, isPending: isInviting } =
    useOrganizationCreateInvitationMutation()

  const FormSchema = z
    .object({
      email: emailSchema,
      role: z.string().min(1, 'Role is required'),
      accessScope: accessScopeSchema,
      projectRef: z.string(),
      guestAccess: z.object({
        memberId: z.string(),
        grants: z.array(
          z.object({
            roleId: z.string(),
            enabled: z.boolean(),
            branchesOnly: z.boolean(),
            expiryMode: z.enum(['1h', '1d', '7d', '30d', 'custom', 'never']),
            hasExpiry: z.boolean(),
            expiry: z.string(),
            ipRanges: z.array(z.object({ value: z.string() })),
          })
        ),
      }),
      requireSso: z.enum(['auto', 'sso', 'non-sso']),
    })
    .superRefine((data, ctx) => {
      const isGuestInvite = isJitDbAccessEnabled && isExternalCollaboratorRole(data.role)

      if (isGuestInvite) {
        if (!data.projectRef) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'A project must be selected for external collaborators',
            path: ['projectRef'],
          })
        }

        const guestError = validateGuestAccessGrants(data.guestAccess.grants)
        if (guestError) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: guestError,
            path: ['guestAccess'],
          })
        }
        return
      }

      const selectedRole = orgScopedRoles.find((role) => role.id.toString() === data.role)
      if (!selectedRole) return

      if (
        roleRequiresOrgWideAccess(selectedRole.name) &&
        data.accessScope !== ALL_PROJECTS_ACCESS_SCOPE
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${selectedRole.name} must have access to all projects`,
          path: ['accessScope'],
        })
      }
    })

  const form = useForm<InviteMemberFormValues>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const { projectRef, email } = form.watch()
  const selectedRoleId = form.watch('role')
  const isGuestInvite = isJitDbAccessEnabled && isExternalCollaboratorRole(selectedRoleId)

  const selectedRole = useMemo(
    () => orgScopedRoles.find((role) => role.id.toString() === selectedRoleId),
    [orgScopedRoles, selectedRoleId]
  )
  const requiresOrgWideAccess = selectedRole ? roleRequiresOrgWideAccess(selectedRole.name) : false

  const emailCount = parseEmails(email ?? '').length

  useEffect(() => {
    if (isGuestInvite || !requiresOrgWideAccess) return
    if (form.getValues('accessScope') !== ALL_PROJECTS_ACCESS_SCOPE) {
      form.setValue('accessScope', ALL_PROJECTS_ACCESS_SCOPE, { shouldDirty: true })
    }
  }, [form, isGuestInvite, requiresOrgWideAccess])

  const onInviteMember = async (values: InviteMemberFormValues) => {
    if (!slug) return console.error('Slug is required')
    if (profile?.id === undefined) return console.error('Profile ID required')
    const emails = parseEmails(values.email).map((e) => e.toLowerCase())

    const { alreadyInvited, alreadyMembers, toInvite } = categorizeInviteEmails(
      emails,
      members ?? []
    )

    if (alreadyInvited.length > 0) {
      toast.error(
        alreadyInvited.length === 1
          ? `${alreadyInvited[0]} has already been invited to this organization`
          : `${alreadyInvited.length} emails have already been invited to this organization`
      )
    }
    if (alreadyMembers.length > 0) {
      toast.error(
        alreadyMembers.length === 1
          ? `${alreadyMembers[0]} is already in this organization`
          : `${alreadyMembers.length} emails are already in this organization`
      )
    }
    if (alreadyInvited.length > 0 || alreadyMembers.length > 0) {
      if (toInvite.length === 0) return
    }

    const isGuest = isJitDbAccessEnabled && isExternalCollaboratorRole(values.role)
    const projectPayload = isGuest
      ? buildProjectPayloadFromAccessScope([values.projectRef])
      : buildProjectPayloadFromAccessScope(values.accessScope)
    const ssoPayload = buildSsoPayload(values.requireSso)

    const inviteRoleId = isGuest
      ? resolveExternalCollaboratorInviteRoleForProject(values.projectRef, allRoles)?.roleId
      : Number(values.role)

    if (isGuest && !inviteRoleId) {
      toast.error('External collaborator invites are not available for this organization')
      return
    }

    let pendingAccessGrant
    if (isGuest) {
      try {
        pendingAccessGrant = buildPendingInvitationAccessGrant(
          values.projectRef,
          values.guestAccess
        )
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to prepare database access for this invitation'
        )
        return
      }
    }

    let result: BatchInvitationResult
    try {
      result = (await inviteMemberAsync({
        slug,
        emails: toInvite,
        roleId: inviteRoleId!,
        ...projectPayload,
        ...ssoPayload,
        pendingAccessGrant,
      })) as BatchInvitationResult
    } catch {
      return // onError callback already showed the toast
    }

    const { succeeded, failed } = result

    if (succeeded.length > 0) {
      toast.success(
        succeeded.length === 1
          ? 'Successfully sent invitation to new member'
          : `Successfully sent invitations to ${succeeded.length} new members`
      )
    }

    for (const { email, error } of failed) {
      toast.error(`Failed to invite ${email}: ${error}`)
    }

    if (succeeded.length > 0) {
      if (isGuest) {
        toast.message('Invitation sent', {
          description: 'Temporary database access will be ready when they accept the invitation.',
        })
      }
      closeInviteSheet()
    }
  }

  useEffect(() => {
    if (isRolesSuccess && isOpen) {
      const developerRoleId = orgScopedRoles
        .find((role) => role.name === 'Developer')
        ?.id.toString()

      if (developerRoleId !== undefined && form.getValues('role') === '') {
        form.setValue('role', developerRoleId, { shouldDirty: false })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRolesSuccess, isOpen])

  const hasUnsavedChanges = form.formState.isDirty

  const closeInviteSheet = () => {
    setAccessScopeDropdownOpen(false)
    setProjectDropdownOpen(false)
    setIsOpen(false)
    form.reset(defaultValues)
  }

  const {
    confirmOnClose,
    handleOpenChange,
    modalProps: discardChangesModalProps,
  } = useConfirmOnClose({
    checkIsDirty: () => hasUnsavedChanges,
    onClose: closeInviteSheet,
  })

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Shortcut
          id={SHORTCUT_IDS.ORG_TEAM_INVITE}
          onTrigger={() => {
            if (canInviteMembers) setIsOpen(true)
          }}
          side="bottom"
          tooltipOpen={isOpen ? false : undefined}
        >
          <ButtonTooltip
            variant="primary"
            disabled={!canInviteMembers}
            icon={<UserPlus size={14} />}
            className="pointer-events-auto grow md:grow-0"
            onClick={() => setIsOpen(true)}
            tooltip={{
              content: {
                side: 'bottom',
                text: !organizationMembersCreationEnabled
                  ? 'Inviting members is currently disabled'
                  : !canInviteMembers
                    ? 'You need additional permissions to invite members to this organization'
                    : undefined,
              },
            }}
          >
            Invite members
          </ButtonTooltip>
        </Shortcut>
      </SheetTrigger>
      <SheetContent size="lg" className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>Invite team members</SheetTitle>
          <SheetDescription>
            Send invitations and choose the access each new team member receives.
          </SheetDescription>
        </SheetHeader>
        <SheetSection className="grow overflow-auto p-0">
          <Form {...form}>
            <form
              id="organization-invitation"
              className="flex flex-col"
              onSubmit={form.handleSubmit(onInviteMember)}
            >
              <SheetSection className="flex flex-col gap-y-4">
                <FormField
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout layout="horizontal" label="Email addresses">
                      <FormControl className="col-span-6">
                        <ExpandingTextArea
                          autoFocus
                          {...field}
                          autoComplete="off"
                          disabled={isInviting}
                          placeholder="name@example.com, name2@example.com, ..."
                          className="max-h-48"
                          data-1p-ignore
                          data-lpignore="true"
                          data-form-type="other"
                          data-bwignore
                        />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />

                <FormField
                  name="role"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout
                      layout="horizontal"
                      label="Role"
                      description={
                        <>
                          Learn more about{' '}
                          <InlineLink href={`${DOCS_URL}/guides/platform/access-control`}>
                            roles and permissions
                          </InlineLink>
                        </>
                      }
                    >
                      <FormControl className="col-span-6">
                        <RadioGroupStacked value={field.value} onValueChange={field.onChange}>
                          {orgScopedRoles.map((role) => {
                            const canAssignRole = rolesAddable.includes(role.id)
                            const isOwnerRole = role.name === 'Owner'
                            const disabledForStripe = isStripeProjectsOrg && isOwnerRole
                            const disabled = !canAssignRole || disabledForStripe
                            const disabledReason = disabledForStripe
                              ? 'Cannot be assigned in Stripe Projects organizations'
                              : !canAssignRole
                                ? 'Additional permissions required to assign role'
                                : undefined

                            return (
                              <FormItem asChild key={role.id}>
                                <FormControl>
                                  <RadioGroupStackedItem
                                    value={role.id.toString()}
                                    disabled={disabled}
                                    label={role.name}
                                    description={[
                                      ROLE_DESCRIPTIONS[role.name] ??
                                        'Permissions are based on the configured organization role.',
                                      disabledReason,
                                    ]
                                      .filter(Boolean)
                                      .join(' ')}
                                  />
                                </FormControl>
                              </FormItem>
                            )
                          })}
                          {isJitDbAccessEnabled && (
                            <FormItem asChild>
                              <FormControl>
                                <RadioGroupStackedItem
                                  value={EXTERNAL_COLLABORATOR_ROLE_ID}
                                  disabled={isExternalCollaboratorDisabled}
                                  label={EXTERNAL_COLLABORATOR_ROLE_NAME}
                                  description={
                                    isExternalCollaboratorDisabled &&
                                    externalCollaboratorDisabledReason ? (
                                      <>
                                        <span className="block text-foreground-light">
                                          {externalCollaboratorDisabledReason}
                                        </span>
                                        <span className="block mt-1">
                                          {EXTERNAL_COLLABORATOR_ROLE_DESCRIPTION}
                                        </span>
                                      </>
                                    ) : (
                                      EXTERNAL_COLLABORATOR_ROLE_DESCRIPTION
                                    )
                                  }
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        </RadioGroupStacked>
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>

              {!isGuestInvite && (
                <SheetSection className="flex flex-col gap-y-4 border-t">
                  <FormField
                    name="accessScope"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout
                        layout="horizontal"
                        label="Access scope"
                        description={
                          requiresOrgWideAccess
                            ? `${selectedRole?.name} always has access to all projects in the organization.`
                            : hasAccessToProjectLevelPermissions
                              ? 'Choose all projects or select one or more specific projects'
                              : 'Invite members to specific projects on Team plan and above'
                        }
                      >
                        <FormControl className="col-span-6">
                          {requiresOrgWideAccess ? (
                            <p className="text-sm text-foreground-light py-2">
                              {ALL_PROJECTS_ACCESS_SCOPE_LABEL}
                            </p>
                          ) : hasAccessToProjectLevelPermissions ? (
                            <TeamAccessScopeSelector
                              value={field.value}
                              onChange={field.onChange}
                              open={accessScopeDropdownOpen}
                              setOpen={setAccessScopeDropdownOpen}
                              fetchOnMount
                              sameWidthAsTrigger
                              checkPosition="left"
                              allowMultipleProjects
                            />
                          ) : (
                            <TeamProjectScopeRadioGroup
                              value="all-projects"
                              onValueChange={() => undefined}
                              hasProjectScopeEntitlement={false}
                            />
                          )}
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </SheetSection>
              )}

              {isGuestInvite && (
                <SheetSection className="flex flex-col gap-y-4 border-t">
                  <FormField
                    name="projectRef"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout
                        layout="horizontal"
                        label="Project scope"
                        description="Database access applies to this project"
                      >
                        <FormControl className="col-span-6">
                          <OrganizationProjectSelector
                            fetchOnMount
                            sameWidthAsTrigger
                            checkPosition="left"
                            selectedRef={projectRef}
                            open={projectDropdownOpen}
                            setOpen={setProjectDropdownOpen}
                            searchPlaceholder="Search project..."
                            onSelect={(project) => {
                              field.onChange(project.ref)
                              setGuestParentProjectRef(project.parent_project_ref ?? null)
                            }}
                            onInitialLoad={(projects) => {
                              const project = projects[0]
                              field.onChange(project?.ref ?? '')
                              setGuestParentProjectRef(project?.parent_project_ref ?? null)
                            }}
                          />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />

                  <TemporaryAccessInviteGrantSection
                    projectRef={projectRef}
                    parentProjectRef={guestParentProjectRef}
                    guestAccess={form.watch('guestAccess')}
                    control={form.control}
                    onGuestAccessChange={(next) =>
                      form.setValue('guestAccess', next, { shouldDirty: true })
                    }
                  />
                </SheetSection>
              )}

              {hasSsoProvider && (
                <SheetSection className="flex flex-col gap-y-4 border-t">
                  <FormField
                    name="requireSso"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout
                        layout="horizontal"
                        label="Invitation type"
                        description="Choose how the invitee should authenticate"
                      >
                        <FormControl className="col-span-6">
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Automatic (based on your account)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="auto">
                                  Automatic (based on your account)
                                </SelectItem>
                                <SelectItem value="sso">Require SSO authentication</SelectItem>
                                <SelectItem value="non-sso">
                                  Email/password authentication
                                </SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </SheetSection>
              )}
            </form>
          </Form>
        </SheetSection>
        <SheetFooter>
          <Button variant="default" onClick={confirmOnClose}>
            Cancel
          </Button>
          <Shortcut
            id={SHORTCUT_IDS.ORG_TEAM_INVITE_SUBMIT}
            onTrigger={() => form.handleSubmit(onInviteMember)()}
            options={{ enabled: isOpen && !isInviting }}
            side="top"
          >
            <Button
              variant="primary"
              form="organization-invitation"
              type="submit"
              loading={isInviting}
            >
              {emailCount >= 2 ? 'Send invitations' : 'Send invitation'}
            </Button>
          </Shortcut>
        </SheetFooter>
      </SheetContent>
      <DiscardChangesConfirmationDialog
        {...discardChangesModalProps}
        description="Are you sure you want to discard your changes? Your invitation will not be sent."
      />
    </Sheet>
  )
}
