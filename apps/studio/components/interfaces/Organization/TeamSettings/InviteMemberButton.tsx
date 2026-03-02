import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  ExpandingTextArea,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  DialogFooter,
  Form_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  Select_Shadcn_,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useGetRolesManagementPermissions } from './TeamSettings.utils'
import { UserPlus } from 'lucide-react'
import { Admonition } from 'ui-patterns'

function parseEmails(value: string): string[] {
  return value
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
}

export const InviteMemberButton = () => {
  const { slug } = useParams()
  const { profile } = useProfile()
  const { data: organization } = useSelectedOrganizationQuery()
  const { permissions: permissions } = useGetPermissions()

  const { organizationMembersCreate: organizationMembersCreationEnabled } = useIsFeatureEnabled([
    'organization_members:create',
  ])

  const [isOpen, setIsOpen] = useState(false)
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false)
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)

  const { data: members } = useOrganizationMembersQuery({ slug })
  const { data: allRoles, isSuccess } = useOrganizationRolesV2Query({ slug })
  const orgScopedRoles = allRoles?.org_scoped_roles ?? []

  const currentPlan = organization?.plan
  const isFreeOrProPlan = currentPlan?.id === 'free' || currentPlan?.id === 'pro'
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

  const emailSchema = z
    .string()
    .min(1, 'At least one email address is required')
    .refine(
      (val) => {
        const emails = parseEmails(val)
        if (emails.length === 0) return false
        return emails.every((e) => z.string().email().safeParse(e).success)
      },
      (val) => {
        const emails = parseEmails(val)
        const invalid = emails.find((e) => !z.string().email().safeParse(e).success)
        return {
          message: invalid
            ? `Invalid email address: ${invalid}`
            : 'At least one email address is required',
        }
      }
    )

  const FormSchema = z.object({
    email: emailSchema,
    role: z.string().min(1, 'Role is required'),
    applyToOrg: z.boolean(),
    projectRef: z.string(),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues: { email: '', role: '', applyToOrg: true, projectRef: '' },
  })

  const { applyToOrg, projectRef, email } = form.watch()

  const emailCount = parseEmails(email ?? '').length

  const onInviteMember = async (values: z.infer<typeof FormSchema>) => {
    if (!slug) return console.error('Slug is required')
    if (profile?.id === undefined) return console.error('Profile ID required')

    const developerRole = orgScopedRoles.find((role) => role.name === 'Developer')
    const emails = parseEmails(values.email).map((e) => e.toLowerCase())

    const alreadyInvited: string[] = []
    const alreadyMembers: string[] = []
    const toInvite: string[] = []

    for (const emailAddress of emails) {
      const existingMember = (members ?? []).find((member) => member.primary_email === emailAddress)
      if (existingMember !== undefined) {
        if (existingMember.invited_id) {
          alreadyInvited.push(emailAddress)
        } else {
          alreadyMembers.push(emailAddress)
        }
      } else {
        toInvite.push(emailAddress)
      }
    }

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

    const projectPayload =
      !values.applyToOrg && values.projectRef ? { projects: [values.projectRef] } : {}
    const results = await Promise.allSettled(
      toInvite.map((emailAddress) =>
        inviteMemberAsync({
          slug,
          email: emailAddress,
          roleId: Number(values.role),
          ...projectPayload,
        })
      )
    )

    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failedEmails = toInvite.filter((_, i) => results[i].status === 'rejected')

    if (successCount > 0) {
      toast.success(
        successCount === 1
          ? 'Successfully sent invitation to new member'
          : `Successfully sent invitations to ${successCount} new members`
      )
      setIsOpen(false)
      form.reset({
        email: '',
        role: developerRole?.id.toString() ?? '',
        applyToOrg: true,
        projectRef: '',
      })
    }
    if (failedEmails.length > 0) {
      toast.error(
        failedEmails.length === 1
          ? `Failed to send invitation to ${failedEmails[0]}`
          : `Failed to send invitations to ${failedEmails.length} emails`
      )
    }
  }

  useEffect(() => {
    if (isSuccess && isOpen) {
      const developerRole = orgScopedRoles.find((role) => role.name === 'Developer')
      if (developerRole !== undefined) {
        form.reset({
          ...form.getValues(),
          role: developerRole.id.toString(),
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, isOpen])

  const hasUnsavedChanges = form.formState.isDirty

  const handleOpenChange = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      setIsDiscardConfirmOpen(true)
    } else {
      setIsOpen(open)
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setIsDiscardConfirmOpen(true)
    } else {
      form.reset({
        email: '',
        role: '',
        applyToOrg: true,
        projectRef: '',
      })
      setIsOpen(false)
    }
  }

  const handleDiscardConfirm = () => {
    form.reset({
      email: '',
      role: '',
      applyToOrg: true,
      projectRef: '',
    })
    setIsDiscardConfirmOpen(false)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <ButtonTooltip
          type="primary"
          disabled={!canInviteMembers}
          icon={<UserPlus size={14} />}
          className="pointer-events-auto flex-grow md:flex-grow-0"
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
          layout={isFreeOrProPlan ? 'vertical' : 'horizontal'}
          className="rounded-none border-t-0 border-x-0 px-5"
          description="Enforce login via your company identity provider for added security and access control. Available on Team plan and above."
          actions={
            <>
              <Button asChild type="default">
                <Link href={`${DOCS_URL}/guides/platform/sso`} target="_blank" rel="noreferrer">
                  Learn more
                </Link>
              </Button>
              {isFreeOrProPlan ? (
                <UpgradePlanButton
                  plan="Team"
                  source="inviteMemberSSO"
                  featureProposition="enable Single Sign-on (SSO)"
                />
              ) : null}
            </>
          }
        />
        <Form_Shadcn_ {...form}>
          <form
            id="organization-invitation"
            className="flex flex-col gap-y-4"
            onSubmit={form.handleSubmit(onInviteMember)}
          >
            <DialogSection className="flex flex-col gap-y-4 pb-2">
              <FormField_Shadcn_
                name="role"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="Role">
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
              {hasAccessToProjectLevelPermissions && (
                <FormField_Shadcn_
                  name="applyToOrg"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout layout="flex" label="Grant this role on all projects">
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
              {!applyToOrg && (
                <FormField_Shadcn_
                  name="projectRef"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout
                      label="Select a project"
                      description="Project access can be adjusted after the user joins"
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
                  <FormItemLayout label="Email addresses">
                    <FormControl_Shadcn_>
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
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </DialogSection>
            <DialogFooter className="!justify-between">
              <Button type="default" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={isInviting}>
                {emailCount >= 2 ? 'Send invitations' : 'Send invitation'}
              </Button>
            </DialogFooter>
          </form>
        </Form_Shadcn_>
      </DialogContent>
      <AlertDialog open={isDiscardConfirmOpen} onOpenChange={setIsDiscardConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to discard your changes? Your invitation will not be sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={handleDiscardConfirm}>
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
