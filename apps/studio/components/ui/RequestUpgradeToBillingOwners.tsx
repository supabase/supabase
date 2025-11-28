import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import z from 'zod'

import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PropsWithChildren } from 'react'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  TextArea_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const FormSchema = z.object({
  note: z.string().optional(),
})

interface RequestUpgradeToBillingOwnersProps {
  plan?: 'Pro' | 'Team' | 'Enterprise'
  addon?: 'pitr' | 'customDomain' | 'spendCap' | 'computeSize'
  /** Used in the default message template, e.g: "Upgrade to ..." */
  featureProposition?: string
}

export const RequestUpgradeToBillingOwners = ({
  plan = 'Pro',
  addon,
  featureProposition,
  children,
}: PropsWithChildren<RequestUpgradeToBillingOwnersProps>) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const isFreePlan = organization?.plan?.id === 'free'

  const { data: members = [] } = useOrganizationMembersQuery({ slug: organization?.slug })
  const { data: roles } = useOrganizationRolesV2Query({ slug: organization?.slug })
  const orgRoles = roles?.org_scoped_roles ?? []

  const formattedAddonName =
    addon === 'pitr' ? 'PITR' : addon === 'customDomain' ? 'Custom Domain' : ''

  const target = !!project
    ? `for the project "${project?.name}"`
    : !!organization
      ? `for the organization "${organization.name}"`
      : ''
  const action =
    addon === 'spendCap'
      ? `disable spend cap`
      : addon === 'computeSize'
        ? `change the compute size`
        : `enable the ${formattedAddonName} add-on`
  const titleText = !!addon
    ? addon === 'spendCap'
      ? `Request to disable spend cap`
      : addon === 'computeSize'
        ? 'Request to change compute size'
        : `Request to enable the ${formattedAddonName} add-on`
    : `Request an upgrade for the ${plan} Plan`
  const buttonText = !!children
    ? children
    : !!addon
      ? addon === 'spendCap'
        ? 'Request to disable spend cap'
        : addon === 'computeSize'
          ? 'Request to change compute'
          : 'Request to enable addon'
      : `Request upgrade to ${plan}`

  const defaultValues = {
    note: !!addon
      ? addon === 'spendCap'
        ? `We'd like to ${isFreePlan ? 'upgrade to Pro and ' : ''}${action} ${target} so that we can ${featureProposition}`
        : `We'd like to ${isFreePlan ? 'upgrade to Pro and ' : ''}${action} ${target} so that we can ${featureProposition}`
      : `We'd like to upgrade to the ${plan} plan to ${featureProposition ?? 'use a feature'} ${target}`,
  }
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues,
    values: defaultValues,
  })

  // [Joshen] This is a pretty naive way of checking billing owners by raw role names
  // Ideally we derive billing owners using permissions checking - but the current permissions
  // logic is only contextualized to that of the current user, not other members
  const billingOwners = members.filter((member) => {
    const roles = member.role_ids
      .map((x) => orgRoles.find((role) => role.id === x)?.name)
      .filter(Boolean)
    return !member.invited_id && (roles.includes('Owner') || roles.includes('Administrator'))
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    // TBD API implementation
    console.log('Submit')
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="primary">{buttonText}</Button>
      </DialogTrigger>
      <DialogContent>
        <Form_Shadcn_ {...form}>
          <form id="request-upgrade-form" onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{titleText}</DialogTitle>
              <DialogDescription>
                Let your organization's billing owners know your interest in this
              </DialogDescription>
            </DialogHeader>

            <DialogSectionSeparator />

            <DialogSection className="flex flex-col gap-y-6">
              <div>
                <p className="text-sm">
                  Your request will be sent to the following emails, who are billing owners of your
                  organization:
                </p>
                <ul className="list-disc pl-6 mt-2">
                  {billingOwners.map((member) => (
                    <li key={member.gotrue_id} className="text-sm">
                      {member.primary_email}
                    </li>
                  ))}
                </ul>
              </div>
              <FormField_Shadcn_
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItemLayout
                    name="note"
                    label="Add a note to your request (optional)"
                    layout="vertical"
                  >
                    <FormControl_Shadcn_>
                      <TextArea_Shadcn_
                        id="note"
                        {...field}
                        rows={3}
                        placeholder={
                          !!addon
                            ? addon === 'spendCap'
                              ? 'e.g. We need to disabled spend cap on this project to do something'
                              : 'e.g. We need to enable this add-on to do something with the project'
                            : 'e.g. We need to upgrade to the Pro plan to use this feature'
                        }
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </DialogSection>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="default" className="opacity-100">
                  Cancel
                </Button>
              </DialogClose>
              <Button htmlType="submit">Submit request</Button>
            </DialogFooter>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
