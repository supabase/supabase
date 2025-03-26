import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Form, FormControl, FormField } from '@ui/components/shadcn/ui/form'
import { useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { FormActions } from 'components/ui/Forms/FormActions'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent } from 'components/ui/Forms/FormSection'
import NoPermission from 'components/ui/NoPermission'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { useOrganizationUpdateMutation } from 'data/organizations/organization-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { FormMessage_Shadcn_, Input_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

const FORM_ID = 'org-billing-email'
const formSchema = z.object({
  billingEmail: z.string().email('Please provide a valid email address').optional(),
  additionalBillingEmails: z.string().email({ message: 'invalid_email' }).array().default([]),
})

const BillingEmail = () => {
  const { slug } = useParams()
  const selectedOrganization = useSelectedOrganization()

  const { name, billing_email } = selectedOrganization ?? {}

  const canUpdateOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')
  const canReadBillingEmail = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  const { data: billingCustomer, isLoading: loadingBillingCustomer } =
    useOrganizationCustomerProfileQuery({ slug }, { enabled: canReadBillingEmail })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      billingEmail: billing_email ?? '',
      additionalBillingEmails: billingCustomer?.additional_emails ?? [],
    },
  })
  const { additionalBillingEmails } = form.watch()
  const { errors } = form.formState
  const additionalEmailsError = errors.additionalBillingEmails ?? []

  const { mutate: updateOrganization, isLoading: isUpdating } = useOrganizationUpdateMutation()

  const onUpdateOrganizationEmail = async (values: z.infer<typeof formSchema>) => {
    if (!canUpdateOrganization) {
      return toast.error('You do not have the required permissions to update this organization')
    }
    if (!slug) return console.error('Slug is required')
    if (!name) return console.error('Organization name is required')

    updateOrganization(
      {
        slug,
        name,
        billing_email: values.billingEmail,
        additional_billing_emails: values.additionalBillingEmails,
      },
      {
        onSuccess: () => {
          toast.success('Successfully saved settings')
          form.reset(values)
        },
      }
    )
  }

  useEffect(() => {
    if (billingCustomer) {
      form.reset({
        billingEmail: billing_email,
        additionalBillingEmails: billingCustomer.additional_emails ?? [],
      })
    }
  }, [billingCustomer])

  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail>
        <div className="sticky space-y-2 top-12">
          <p className="text-foreground text-base m-0">Email Recipient</p>
          <p className="text-sm text-foreground-light m-0">
            All billing correspondence will go to this email
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {!canReadBillingEmail ? (
          <NoPermission resourceText="view this organization's email recipients" />
        ) : (
          <Form {...form}>
            <form id={FORM_ID} onSubmit={form.handleSubmit(onUpdateOrganizationEmail)}>
              <FormPanel
                footer={
                  <div className="flex py-4 px-8">
                    <FormActions
                      form={FORM_ID}
                      isSubmitting={isUpdating}
                      hasChanges={form.formState.isDirty}
                      handleReset={form.reset}
                      disabled={!canUpdateOrganization}
                      helper={
                        !canUpdateOrganization
                          ? 'You need additional permissions to update billing emails'
                          : undefined
                      }
                    />
                  </div>
                }
              >
                <FormSection>
                  <FormSectionContent fullWidth loading={loadingBillingCustomer}>
                    <FormField
                      control={form.control}
                      name="billingEmail"
                      render={({ field }) => (
                        <FormItemLayout label="Email address">
                          <FormControl>
                            <Input_Shadcn_
                              type="email"
                              {...field}
                              placeholder="Email"
                              disabled={!canUpdateOrganization}
                            />
                          </FormControl>
                          <FormMessage_Shadcn_ />
                        </FormItemLayout>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="additionalBillingEmails"
                      render={({ field }) => (
                        <FormItemLayout
                          hideMessage
                          label={
                            <div className="flex items-center gap-x-1">
                              <span>Additional emails</span>
                              <InfoTooltip side="bottom">
                                These email addresses will be CC'd in automated invoice or payment
                                failure emails. Payment receipts will still only go to the primary
                                billing address.
                              </InfoTooltip>
                            </div>
                          }
                        >
                          <FormControl>
                            <MultiSelector values={field.value} onValuesChange={field.onChange}>
                              <MultiSelectorTrigger
                                deletableBadge
                                showIcon={false}
                                mode="inline-combobox"
                                label="Add additional recipients"
                                badgeLimit="wrap"
                              />
                              <MultiSelectorContent>
                                <MultiSelectorList creatable />
                              </MultiSelectorContent>
                            </MultiSelector>
                          </FormControl>
                          {/* [Joshen] Manually construct the message here as MultiSelector doesn't handle array errors from RHF atm */}
                          {Array.isArray(additionalEmailsError) &&
                            additionalEmailsError.length > 0 && (
                              <div className="flex flex-col gap-y-1 mt-2">
                                {additionalEmailsError.map((x, idx) => (
                                  <p
                                    key={`email-error-${idx}`}
                                    className="text-sm text-destructive"
                                  >
                                    "{additionalBillingEmails[idx]}" is not a valid email address
                                  </p>
                                ))}
                              </div>
                            )}
                        </FormItemLayout>
                      )}
                    />
                  </FormSectionContent>
                </FormSection>
              </FormPanel>
            </form>
          </Form>
        )}
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}

export default BillingEmail
