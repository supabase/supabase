import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import InformationBox from 'components/ui/InformationBox'
import { OrganizationProjectSelector } from 'components/ui/OrganizationProjectSelector'
import { UpgradePlanButton } from 'components/ui/UpgradePlanButton'
import { useOrganizationCreateInvitationMutation } from 'data/organization-members/organization-invitation-create-mutation'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useHasAccessToProjectLevelPermissions } from 'data/subscriptions/org-subscription-query'
import { doPermissionsCheck, useGetPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { DOCS_URL } from 'lib/constants'
import { useProfile } from 'lib/profile'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  Select_Shadcn_,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useGetRolesManagementPermissions } from './TeamSettings.utils'

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

  const currentPlan = organization?.plan
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

  const { mutate: inviteMember, isPending: isInviting } = useOrganizationCreateInvitationMutation()

  const FormSchema = z.object({
    email: z.string().email('Must be a valid email address').min(1, 'Email is required'),
    role: z.string().min(1, 'Role is required'),
    applyToOrg: z.boolean(),
    projectRef: z.string(),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues: { email: '', role: '', applyToOrg: true, projectRef: '' },
  })

  const { applyToOrg, projectRef } = form.watch()

  const onInviteMember = async (values: z.infer<typeof FormSchema>) => {
    if (!slug) return console.error('Slug is required')
    if (profile?.id === undefined) return console.error('Profile ID required')

    const developerRole = orgScopedRoles.find((role) => role.name === 'Developer')
    const existingMember = (members ?? []).find(
      (member) => member.primary_email === values.email.toLowerCase()
    )
    if (existingMember !== undefined) {
      if (existingMember.invited_id) {
        return toast('User has already been invited to this organization')
      } else {
        return toast('User is already in this organization')
      }
    }

    inviteMember(
      {
        slug,
        email: values.email.toLowerCase(),
        roleId: Number(values.role),
        ...(!values.applyToOrg && values.projectRef ? { projects: [values.projectRef] } : {}),
      },
      {
        onSuccess: () => {
          toast.success('Successfully sent invitation to new member')
          setIsOpen(!isOpen)

          form.reset({
            email: '',
            role: developerRole?.id.toString() ?? '',
            applyToOrg: true,
            projectRef: '',
          })
        },
      }
    )
  }

  useEffect(() => {
    if (isSuccess && isOpen) {
      const developerRole = orgScopedRoles.find((role) => role.name === 'Developer')
      if (developerRole !== undefined) form.setValue('role', developerRole.id.toString())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <ButtonTooltip
          type="primary"
          disabled={!canInviteMembers}
          className="pointer-events-auto flex-grow md:flex-grow-0"
          onClick={() => setIsOpen(true)}
          tooltip={{
            content: {
              side: 'bottom',
              text: !organizationMembersCreationEnabled
                ? 'Inviting members is currently disabled'
                : !canInviteMembers
                  ? 'You need additional permissions to invite a member to this organization'
                  : undefined,
            },
          }}
        >
          Invite member
        </ButtonTooltip>
      </DialogTrigger>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Invite a member to this organization</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Form_Shadcn_ {...form}>
          <form
            id="organization-invitation"
            className="flex flex-col gap-y-4"
            onSubmit={form.handleSubmit(onInviteMember)}
          >
            <DialogSection className="flex flex-col gap-y-4 pb-2">
              {hasAccessToProjectLevelPermissions && (
                <FormField_Shadcn_
                  name="applyToOrg"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex"
                      label="Apply role to all projects in the organization"
                    >
                      <FormControl_Shadcn_>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(value) => form.setValue('applyToOrg', value)}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              )}
              <FormField_Shadcn_
                name="role"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="Member role">
                    <FormControl_Shadcn_>
                      <Select_Shadcn_
                        value={field.value}
                        onValueChange={(value) => form.setValue('role', value)}
                      >
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
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              {!applyToOrg && (
                <FormField_Shadcn_
                  name="projectRef"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout
                      label="Select a project"
                      description="You can assign roles to multiple projects once the invite is accepted"
                    >
                      <FormControl_Shadcn_>
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
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              )}
              <FormField_Shadcn_
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="Email address">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        autoFocus
                        {...field}
                        autoComplete="off"
                        disabled={isInviting}
                        placeholder="Enter email address"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <InformationBox
                defaultVisibility={false}
                title="Single Sign-on (SSO) login option available"
                hideCollapse={false}
                description={
                  <div className="space-y-4 mb-1">
                    <p>
                      Supabase offers single sign-on (SSO) as a login option to provide additional
                      account security for your team. This allows company administrators to enforce
                      the use of an identity provider when logging into Supabase.
                    </p>
                    <p>This is only available for organizations on Team Plan or above.</p>
                    <div className="flex items-center space-x-2">
                      <Button asChild type="default">
                        <Link
                          href={`${DOCS_URL}/guides/platform/sso`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Learn more
                        </Link>
                      </Button>
                      {(currentPlan?.id === 'free' || currentPlan?.id === 'pro') && (
                        <UpgradePlanButton
                          plan="Team"
                          source="inviteMemberSSO"
                          featureProposition="enable Single Sign-on (SSO)"
                        />
                      )}
                    </div>
                  </div>
                }
              />
            </DialogSection>
            <DialogSectionSeparator />
            <DialogSection className="pt-0">
              <Button block htmlType="submit" loading={isInviting}>
                Send invitation
              </Button>
            </DialogSection>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
