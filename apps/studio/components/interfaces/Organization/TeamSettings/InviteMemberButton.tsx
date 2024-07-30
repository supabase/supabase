import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { isNil } from 'lodash'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import * as z from 'zod'

import { useParams } from 'common'
import InformationBox from 'components/ui/InformationBox'
import { useOrganizationCreateInvitationMutation } from 'data/organization-members/organization-invitation-create-mutation'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { useOrganizationMemberInviteCreateMutation } from 'data/organizations/organization-member-invite-create-mutation'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import {
  doPermissionsCheck,
  useCheckPermissions,
  useGetPermissions,
} from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useIsOptedIntoProjectLevelPermissions } from 'hooks/ui/useFlag'
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
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  Select_Shadcn_,
  Switch,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import { useGetRolesManagementPermissions } from './TeamSettings.utils'

export const InviteMemberButton = () => {
  const { slug } = useParams()
  const { profile } = useProfile()
  const organization = useSelectedOrganization()
  const { permissions: permissions } = useGetPermissions()
  const isOptedIntoProjectLevelPermissions = useIsOptedIntoProjectLevelPermissions(slug as string)

  const [isOpen, setIsOpen] = useState(false)

  const { data: projects } = useProjectsQuery()
  const { data: members } = useOrganizationMembersQuery({ slug })
  const { data: allRoles, isSuccess } = useOrganizationRolesV2Query({ slug })
  const orgScopedRoles = (allRoles?.org_scoped_roles ?? []).sort(
    (a, b) => b.base_role_id - a.base_role_id
  )
  const orgProjects = (projects ?? []).filter(
    (project) => project.organization_id === organization?.id
  )
  const canReadSubscriptions = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )
  const { data: subscription, isSuccess: isSuccessSubscription } = useOrgSubscriptionQuery(
    { orgSlug: slug },
    { enabled: canReadSubscriptions }
  )
  const currentPlan = subscription?.plan

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
    orgScopedRoles.some(({ id: role_id }) =>
      doPermissionsCheck(
        permissions,
        PermissionAction.CREATE,
        'user_invites',
        { resource: { role_id } },
        organization?.slug
      )
    )

  const { mutate: inviteMember, isLoading: isInviting } = useOrganizationCreateInvitationMutation()
  const { mutate: inviteMemberOld, isLoading: isInvitingOld } =
    useOrganizationMemberInviteCreateMutation()

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

  const { applyToOrg } = form.watch()

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

    if (isOptedIntoProjectLevelPermissions) {
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
    } else {
      inviteMemberOld(
        {
          slug,
          invitedEmail: values.email.toLowerCase(),
          ownerId: profile.id,
          roleId: Number(values.role),
        },
        {
          onSuccess: (data) => {
            if (isNil(data)) {
              toast.error('Failed to add member')
            } else {
              toast.success('Successfully added new member')
              setIsOpen(!isOpen)
              form.reset({
                email: '',
                role: developerRole?.id.toString() ?? '',
                applyToOrg: true,
                projectRef: '',
              })
            }
          },
        }
      )
    }
  }

  useEffect(() => {
    if (isSuccess && isOpen) {
      const developerRole = orgScopedRoles.find((role) => role.name === 'Developer')
      if (developerRole !== undefined) form.setValue('role', developerRole.id.toString())
    }
  }, [isSuccess, isOpen])

  useEffect(() => {
    if (!applyToOrg) {
      const firstProject = orgProjects?.[0]
      if (firstProject !== undefined) form.setValue('projectRef', firstProject.ref)
    } else {
      form.setValue('projectRef', '')
    }
  }, [applyToOrg])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Tooltip_Shadcn_>
          <TooltipTrigger_Shadcn_ asChild>
            <Button
              disabled={!canInviteMembers}
              className="pointer-events-auto"
              onClick={() => setIsOpen(true)}
            >
              Invite
            </Button>
          </TooltipTrigger_Shadcn_>
          {!canInviteMembers && (
            <TooltipContent_Shadcn_ side="bottom">
              You need additional permissions to invite a member to this organization
            </TooltipContent_Shadcn_>
          )}
        </Tooltip_Shadcn_>
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
              {isOptedIntoProjectLevelPermissions && currentPlan?.id === 'enterprise' && (
                <FormField_Shadcn_
                  name="applyToOrg"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem_Shadcn_ className="flex items-center gap-x-4">
                      <FormControl_Shadcn_>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(value) => form.setValue('applyToOrg', value)}
                        />
                      </FormControl_Shadcn_>
                      <FormLabel_Shadcn_>
                        Apply role to all projects in the organization
                      </FormLabel_Shadcn_>
                    </FormItem_Shadcn_>
                  )}
                />
              )}
              <FormField_Shadcn_
                name="role"
                control={form.control}
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                    <FormLabel_Shadcn_>Member role</FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <Select_Shadcn_
                        value={field.value}
                        onValueChange={(value) => form.setValue('role', value)}
                      >
                        <SelectTrigger_Shadcn_ className="text-sm h-10 capitalize">
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
                  </FormItem_Shadcn_>
                )}
              />
              {!applyToOrg && (
                <FormField_Shadcn_
                  name="projectRef"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                      <FormLabel_Shadcn_>Select a project</FormLabel_Shadcn_>
                      <FormControl_Shadcn_>
                        <Select_Shadcn_
                          value={field.value}
                          onValueChange={(value) => form.setValue('projectRef', value)}
                        >
                          <SelectTrigger_Shadcn_ className="text-sm h-10 capitalize text-left truncate max-w-[470px]">
                            {orgProjects.find((project) => project.ref === field.value)?.name ??
                              'Unknown'}
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            <SelectGroup_Shadcn_>
                              {orgProjects.map((project) => {
                                return (
                                  <SelectItem_Shadcn_
                                    key={project.id}
                                    value={project.ref}
                                    className="text-sm"
                                  >
                                    {project.name}
                                  </SelectItem_Shadcn_>
                                )
                              })}
                            </SelectGroup_Shadcn_>
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </FormControl_Shadcn_>
                      <FormDescription_Shadcn_>
                        You can assign roles to multiple projects once the invite is accepted
                      </FormDescription_Shadcn_>
                    </FormItem_Shadcn_>
                  )}
                />
              )}
              <FormField_Shadcn_
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                    <FormLabel_Shadcn_>Email address</FormLabel_Shadcn_>
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        autoFocus
                        {...field}
                        autoComplete="off"
                        disabled={isInviting || isInvitingOld}
                        placeholder="Enter email address"
                      />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
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
                          href="https://supabase.com/docs/guides/platform/sso"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Learn more
                        </Link>
                      </Button>
                      {isSuccessSubscription &&
                        (currentPlan?.id === 'free' || currentPlan?.id === 'pro') && (
                          <Button asChild type="default">
                            <Link href={`/org/${slug}/billing?panel=subscriptionPlan`}>
                              Upgrade to Team
                            </Link>
                          </Button>
                        )}
                    </div>
                  </div>
                }
              />
            </DialogSection>
            <DialogSectionSeparator />
            <DialogSection className="pt-0">
              <Button block htmlType="submit" loading={isInviting || isInvitingOld}>
                Send invitation
              </Button>
            </DialogSection>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
