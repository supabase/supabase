import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { isNil } from 'lodash'
import { Check, ChevronsUpDown } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import InformationBox from 'components/ui/InformationBox'
import { useOrganizationCreateInvitationMutation } from 'data/organization-members/organization-invitation-create-mutation'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { useOrganizationMemberInviteCreateMutation } from 'data/organizations/organization-member-invite-create-mutation'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import {
  useHasAccessToProjectLevelPermissions,
  useOrgSubscriptionQuery,
} from 'data/subscriptions/org-subscription-query'
import {
  doPermissionsCheck,
  useCheckPermissions,
  useGetPermissions,
} from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useProfile } from 'lib/profile'
import {
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
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
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  Select_Shadcn_,
  Switch,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useGetRolesManagementPermissions } from './TeamSettings.utils'

export const InviteMemberButton = () => {
  const { slug } = useParams()
  const { profile } = useProfile()
  const organization = useSelectedOrganization()
  const { permissions: permissions } = useGetPermissions()

  const [isOpen, setIsOpen] = useState(false)
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)

  const { data: projects } = useProjectsQuery()
  const { data: members } = useOrganizationMembersQuery({ slug })
  const { data: allRoles, isSuccess } = useOrganizationRolesV2Query({ slug })
  const orgScopedRoles = allRoles?.org_scoped_roles ?? []

  const orgProjects = (projects ?? [])
    .filter((project) => project.organization_id === organization?.id)
    .sort((a, b) => a.name.localeCompare(b.name))
  const canReadSubscriptions = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )
  const { data: subscription, isSuccess: isSuccessSubscription } = useOrgSubscriptionQuery(
    { orgSlug: slug },
    { enabled: canReadSubscriptions }
  )
  const currentPlan = subscription?.plan
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

    if (hasAccessToProjectLevelPermissions) {
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
                        <Popover_Shadcn_
                          open={projectDropdownOpen}
                          onOpenChange={setProjectDropdownOpen}
                        >
                          <PopoverTrigger_Shadcn_ asChild>
                            <Button
                              block
                              type="default"
                              role="combobox"
                              size="small"
                              className="justify-between max-w-[470px]"
                              iconRight={
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              }
                            >
                              {orgProjects.find((project) => project.ref === field.value)?.name ??
                                'Unknown'}
                            </Button>
                          </PopoverTrigger_Shadcn_>
                          <PopoverContent_Shadcn_ sameWidthAsTrigger className="p-0">
                            <Command_Shadcn_
                              // [Joshen] Let's update this to use keywords in CommandItem once cmdk is updated
                              filter={(value, search) => {
                                const project = orgProjects.find((project) => project.ref === value)
                                const projectName = project?.name.toLowerCase()
                                if (
                                  projectName !== undefined &&
                                  projectName.includes(search.toLowerCase())
                                ) {
                                  return 1
                                } else if (value.includes(search)) {
                                  return 1
                                } else {
                                  return 0
                                }
                              }}
                            >
                              <CommandInput_Shadcn_ placeholder="Search project..." />
                              <CommandList_Shadcn_>
                                <CommandEmpty_Shadcn_>No projects found...</CommandEmpty_Shadcn_>
                                <CommandGroup_Shadcn_>
                                  <ScrollArea
                                    className={cn(
                                      (orgProjects || []).length > 7 &&
                                        'max-h-[210px] overflow-y-auto'
                                    )}
                                  >
                                    {orgProjects.map((project) => {
                                      return (
                                        <CommandItem_Shadcn_
                                          key={project.ref}
                                          value={project.ref}
                                          onSelect={(value) => {
                                            form.setValue('projectRef', value)
                                            setProjectDropdownOpen(false)
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              'mr-2 h-4 w-4',
                                              field.value === project.ref
                                                ? 'opacity-100'
                                                : 'opacity-0'
                                            )}
                                          />
                                          {project.name}
                                        </CommandItem_Shadcn_>
                                      )
                                    })}
                                  </ScrollArea>
                                </CommandGroup_Shadcn_>
                              </CommandList_Shadcn_>
                            </Command_Shadcn_>
                          </PopoverContent_Shadcn_>
                        </Popover_Shadcn_>
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
                        disabled={isInviting || isInvitingOld}
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
