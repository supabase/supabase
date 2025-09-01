import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import z from 'zod'

import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
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

interface RequestUpgradeToPaidProps {
  plan?: 'Pro' | 'Team' | 'Enterprise'
  feature?: string
}

export const RequestUpgradeToPaid = ({ plan = 'Pro', feature }: RequestUpgradeToPaidProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  const { data: members = [] } = useOrganizationMembersQuery({ slug: organization?.slug })
  const { data: roles } = useOrganizationRolesV2Query({ slug: organization?.slug })
  const orgRoles = roles?.org_scoped_roles ?? []

  const defaultValues = {
    note: `We'd like to upgrade to the ${plan} plan to use ${feature ?? 'a feature'} for the project "${project?.name}"`,
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
        <Button type="primary">Request upgrade to {plan}</Button>
      </DialogTrigger>
      <DialogContent>
        <Form_Shadcn_ {...form}>
          <form id="request-upgrade-form" onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Request an upgrade for the {plan} Plan</DialogTitle>
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
                        placeholder="e.g We need to upgrade to the Pro plan to use this feature"
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
