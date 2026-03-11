import { zodResolver } from '@hookform/resolvers/zod'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import {
  PlanRequest,
  useSendUpgradeRequestMutation,
} from 'data/organizations/request-upgrade-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useTrack } from 'lib/telemetry/track'
import { PropsWithChildren, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Dialog,
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import z from 'zod'

const FormSchema = z.object({
  note: z.string().optional(),
})

const formId = 'request-upgrade-form'

interface RequestUpgradeToBillingOwnersProps {
  block?: boolean
  plan?: PlanRequest
  addon?: 'pitr' | 'customDomain' | 'spendCap' | 'computeSize'
  /** Used in the default message template, e.g: "Upgrade to ..." */
  featureProposition?: string
  className?: string
}

export const RequestUpgradeToBillingOwners = ({
  block = false,
  plan = 'Pro',
  addon,
  featureProposition,
  children,
  className,
}: PropsWithChildren<RequestUpgradeToBillingOwnersProps>) => {
  const [open, setOpen] = useState(false)
  const track = useTrack()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const slug = organization?.slug
  const currentPlan = organization?.plan?.id
  const isFreePlan = currentPlan === 'free'

  const { data: members = [] } = useOrganizationMembersQuery({ slug: organization?.slug })
  const { data: roles } = useOrganizationRolesV2Query({ slug: organization?.slug })
  const orgRoles = roles?.org_scoped_roles ?? []

  const { mutate: sendUpgradeRequest, isPending: isSubmitting } = useSendUpgradeRequestMutation({
    onSuccess: () => {
      track('request_upgrade_submitted', {
        requestedPlan: plan,
        addon,
        currentPlan,
      })
      toast.success('Successfully sent request to billing owners!')
      setOpen(false)
    },
  })

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
      : `We'd like to upgrade to the ${plan} plan ${!!featureProposition ? ` to ${featureProposition} ` : ''}${target}`,
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
    if (!slug) return console.error('Slug is required')
    sendUpgradeRequest({ slug, plan, note: values.note })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      track('request_upgrade_modal_opened', {
        requestedPlan: plan,
        addon,
        currentPlan,
        featureProposition,
      })
    }
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button block={block} type="primary" className={className}>
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{titleText}</DialogTitle>
              <DialogDescription>
                Let your organization's billing owners know your interest in this
              </DialogDescription>
            </DialogHeader>

            <DialogSectionSeparator />

            <DialogSection className="flex flex-col gap-y-6">
              <div className="flex flex-col gap-y-2">
                <p className="text-sm">
                  Your request will be sent to the following emails, who are billing owners of your
                  organization:
                </p>
                <div className="text-sm flex gap-x-2">
                  <p>
                    {billingOwners
                      .slice(0, 2)
                      .map((x) => x.primary_email)
                      .join(', ')}
                  </p>
                  {billingOwners.length > 2 && (
                    <Tooltip>
                      <TooltipTrigger tabIndex={-1}>
                        <Badge>+1 others</Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <ul className="">
                          {billingOwners.slice(2).map((x) => (
                            <li key={x.gotrue_id}>{x.primary_email}</li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
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
              <Button type="default" disabled={isSubmitting} onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button htmlType="submit" form={formId} loading={isSubmitting}>
                Submit request
              </Button>
            </DialogFooter>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
