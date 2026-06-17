import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { ROLE_DESCRIPTIONS } from './Roles.constants'
import { useGetRolesManagementPermissions } from './TeamSettings.utils'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DocsButton } from '@/components/ui/DocsButton'
import { InlineLink } from '@/components/ui/InlineLink'
import { OrganizationProjectSelector } from '@/components/ui/OrganizationProjectSelector'
import { Shortcut } from '@/components/ui/Shortcut'
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
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { useProfile } from '@/lib/profile'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

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
      closeInviteSheet()
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

  const closeInviteSheet = () => {
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
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>Invite team members</SheetTitle>
          <SheetDescription>
            Send invitations and choose the access each new team member receives.
          </SheetDescription>
        </SheetHeader>
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
        <SheetSection className="grow overflow-auto">
          <Form {...form}>
            <form
              id="organization-invitation"
              className="flex flex-col gap-y-4"
              onSubmit={form.handleSubmit(onInviteMember)}
            >
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
                      </RadioGroupStacked>
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
                              <SelectItem value="non-sso">Email/password authentication</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
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
                    <FormItemLayout
                      layout="horizontal"
                      label="Grant this role on all projects"
                      description="Apply this role to all current and future projects in the organization"
                    >
                      <FormControl className="col-span-6">
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
                      layout="horizontal"
                      label="Select a project"
                      description="Project access can be adjusted after the user joins"
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
