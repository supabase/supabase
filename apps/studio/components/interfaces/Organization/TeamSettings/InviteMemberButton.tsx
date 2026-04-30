import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  ExpandingTextArea,
  Form,
  FormControl,
  FormField,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import {
  BatchInvitationResult,
  buildProjectPayload,
  buildSsoPayload,
  categorizeInviteEmails,
  emailSchema,
  parseEmails,
} from './InviteMemberButton.utils'
import { useGetRolesManagementPermissions } from './TeamSettings.utils'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DocsButton } from '@/components/ui/DocsButton'
import { OrganizationProjectSelector } from '@/components/ui/OrganizationProjectSelector'
import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { useOrganizationCreateInvitationMutation } from '@/data/organization-members/organization-invitation-create-mutation'
import { useOrganizationRolesV2Query } from '@/data/organization-members/organization-roles-query'
import { useOrganizationMembersQuery } from '@/data/organizations/organization-members-query'
import { useOrgSSOConfigQuery } from '@/data/sso/sso-config-query'
import { useHasAccessToProjectLevelPermissions } from '@/data/subscriptions/org-subscription-query'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { doPermissionsCheck, useGetPermissions } from '@/hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { DOCS_URL } from '@/lib/constants'
import { useProfile } from '@/lib/profile'

export const InviteMemberButton = () => {
  const { slug } = useParams()
  const { profile } = useProfile()
  const { data: organization } = useSelectedOrganizationQuery()
  const { permissions: permissions } = useGetPermissions()

  const { organizationMembersCreate: organizationMembersCreationEnabled } = useIsFeatureEnabled([
    'organization_members:create',
  ])

  const [isOpen, setIsOpen] = useState(false)
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)

  const { data: members } = useOrganizationMembersQuery({ slug })
  const { data: allRoles, isSuccess } = useOrganizationRolesV2Query({ slug })
  const orgScopedRoles = allRoles?.org_scoped_roles ?? []

  const { data: ssoConfig } = useOrgSSOConfigQuery({ orgSlug: slug })
  const hasSsoProvider = !!ssoConfig && ssoConfig !== null

  const defaultValues = {
    email: '',
    role: orgScopedRoles.find((role) => role.name === 'Developer')?.id.toString() ?? '',
    applyToOrg: true,
    projectRef: '',
    requireSso: 'auto' as const,
  }

  const { hasAccess: hasAccessToSso } = useCheckEntitlements('auth.platform.sso')
  const hasAccessToProjectLevelPermissions = useHasAccessToProjectLevelPermissions(slug as string)

  const userMemberData = members?.find((m) => m.gotrue_id === profile?.gotrue_id)
  const hasOrgRole =
    (userMemberData?.role_ids ?? []).length === 1 &&
    orgScopedRoles.some((r) => r.id === userMemberData?.role_ids[0])

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

  const { mutateAsync: inviteMemberAsync, isPending: isInviting } =
    useOrganizationCreateInvitationMutation()

  const FormSchema = z
    .object({
      email: emailSchema,
      role: z.string().min(1, 'Role is required'),
      applyToOrg: z.boolean(),
      projectRef: z.string(),
      requireSso: z.enum(['auto', 'sso', 'non-sso']),
    })
    .superRefine((data, ctx) => {
      if (!data.applyToOrg && !data.projectRef) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A project must be selected',
          path: ['projectRef'],
        })
      }
    })

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const { applyToOrg, projectRef, email } = form.watch()

  const emailCount = parseEmails(email ?? '').length

  const onInviteMember = async (values: z.infer<typeof FormSchema>) => {
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

    const projectPayload = buildProjectPayload(values.applyToOrg, values.projectRef)
    const ssoPayload = buildSsoPayload(values.requireSso)

    let result: BatchInvitationResult
    try {
      result = (await inviteMemberAsync({
        slug,
        emails: toInvite,
        roleId: Number(values.role),
        ...projectPayload,
        ...ssoPayload,
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
      closeInviteDialog()
    }
  }

  useEffect(() => {
    if (isSuccess && isOpen) {
      const developerRoleId = orgScopedRoles
        .find((role) => role.name === 'Developer')
        ?.id.toString()

      if (developerRoleId !== undefined && form.getValues('role') === '') {
        form.setValue('role', developerRoleId, { shouldDirty: false })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, isOpen])

  const hasUnsavedChanges = form.formState.isDirty

  const closeInviteDialog = () => {
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
    onClose: closeInviteDialog,
  })

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <ButtonTooltip
          type="primary"
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
      </DialogTrigger>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Invite team members</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Admonition
          type="note"
          showIcon={false}
          title="Single Sign-On (SSO) available"
          layout={!hasAccessToSso ? 'vertical' : 'horizontal'}
          className="rounded-none border-t-0 border-x-0 px-5"
          description="Enforce login via your company identity provider for added security and access control. Available on Team plan and above."
          actions={
            <>
              <DocsButton href={`${DOCS_URL}/guides/platform/sso`} />
              {!hasAccessToSso && (
                <UpgradePlanButton
                  plan="Team"
                  source="inviteMemberSSO"
                  featureProposition="enable Single Sign-on (SSO)"
                />
              )}
            </>
          }
        />
        <Form {...form}>
          <form
            id="organization-invitation"
            className="flex flex-col gap-y-4"
            onSubmit={form.handleSubmit(onInviteMember)}
          >
            <DialogSection className="flex flex-col gap-y-4 pb-2">
              <FormField
                name="role"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="Role">
                    <FormControl>
                      <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger_Shadcn_ className="text-sm capitalize">
                          {orgScopedRoles.find((role) => role.id === Number(field.value))?.name ??
                            'Unknown'}
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          <SelectGroup_Shadcn_>
                            {orgScopedRoles.map((role) => {
                              const canAssignRole = rolesAddable.includes(role.id)

                              return (
                                <SelectItem_Shadcn_
                                  key={role.id}
                                  value={role.id.toString()}
                                  className="text-sm [&>span:nth-child(2)]:w-full [&>span:nth-child(2)]:flex [&>span:nth-child(2)]:items-center [&>span:nth-child(2)]:justify-between"
                                  disabled={!canAssignRole}
                                >
                                  <span>{role.name}</span>
                                  {!canAssignRole && (
                                    <span>Additional permissions required to assign role</span>
                                  )}
                                </SelectItem_Shadcn_>
                              )
                            })}
                          </SelectGroup_Shadcn_>
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormControl>
                  </FormItemLayout>
                )}
              />
              {hasSsoProvider && (
                <FormField
                  name="requireSso"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout
                      label="Invitation type"
                      description="Choose how the invitee should authenticate"
                    >
                      <FormControl>
                        <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger_Shadcn_>
                            <SelectValue_Shadcn_ placeholder="Automatic (based on your account)" />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            <SelectGroup_Shadcn_>
                              <SelectItem_Shadcn_ value="auto">
                                Automatic (based on your account)
                              </SelectItem_Shadcn_>
                              <SelectItem_Shadcn_ value="sso">
                                Require SSO authentication
                              </SelectItem_Shadcn_>
                              <SelectItem_Shadcn_ value="non-sso">
                                Email/password authentication
                              </SelectItem_Shadcn_>
                            </SelectGroup_Shadcn_>
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              )}
              {hasAccessToProjectLevelPermissions && (
                <FormField
                  name="applyToOrg"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout layout="flex" label="Grant this role on all projects">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              )}
              {!applyToOrg && (
                <FormField
                  name="projectRef"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout
                      label="Select a project"
                      description="Project access can be adjusted after the user joins"
                    >
                      <FormControl>
                        <OrganizationProjectSelector
                          fetchOnMount
                          sameWidthAsTrigger
                          checkPosition="left"
                          selectedRef={projectRef}
                          open={projectDropdownOpen}
                          setOpen={setProjectDropdownOpen}
                          searchPlaceholder="Search project..."
                          onSelect={(project) => field.onChange(project.ref)}
                          onInitialLoad={(projects) => field.onChange(projects[0]?.ref ?? '')}
                        />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              )}
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="Email addresses">
                    <FormControl>
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
            </DialogSection>
            <DialogFooter className="justify-between!">
              <Button type="default" onClick={confirmOnClose}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={isInviting}>
                {emailCount >= 2 ? 'Send invitations' : 'Send invitation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      <DiscardChangesConfirmationDialog
        {...discardChangesModalProps}
        description="Are you sure you want to discard your changes? Your invitation will not be sent."
      />
    </Dialog>
  )
}
