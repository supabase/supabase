import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useInView } from 'react-intersection-observer'
import { toast } from 'sonner'
import { Form, FormControl, FormField, FormMessage, Input } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'
import { z } from 'zod'

import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from '@/components/layouts/Scaffold'
import { FormActions } from '@/components/ui/Forms/FormActions'
import { FormPanel } from '@/components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent } from '@/components/ui/Forms/FormSection'
import { NoPermission } from '@/components/ui/NoPermission'
import { useOrganizationCustomerProfileQuery } from '@/data/organizations/organization-customer-profile-query'
import { useOrganizationCustomerProfileUpdateMutation } from '@/data/organizations/organization-customer-profile-update-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

const FORM_ID = 'org-billing-email'
const formSchema = z.object({
  billingEmail: z.string().email('Please provide a valid email address').optional(),
  additionalBillingEmails: z.string().email({ message: 'invalid_email' }).array().default([]),
})

const BillingEmail = () => {
  const { slug } = useParams()

  const { can: canReadBillingEmail, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.customer'
  )
  const { can: canUpdateBillingData } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.customer'
  )

  const { ref, inView } = useInView({ triggerOnce: true })

  const { data: customerProfile, isPending: loadingBillingCustomer } =
    useOrganizationCustomerProfileQuery(
      { slug },
      {
        enabled: canReadBillingEmail && inView,
        select: (data) =>
          data ? { email: data.email, additional_emails: data.additional_emails } : data,
      }
    )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      billingEmail: customerProfile?.email ?? '',
      additionalBillingEmails: customerProfile?.additional_emails ?? [],
    },
  })
  const additionalBillingEmails = useWatch({
    control: form.control,
    name: 'additionalBillingEmails',
  })
  const { errors, isDirty } = form.formState
  const additionalEmailsError = errors.additionalBillingEmails ?? []

  const { mutate: updateCustomerProfile, isPending: isUpdating } =
    useOrganizationCustomerProfileUpdateMutation()

  const onUpdateOrganizationEmail = async (values: z.infer<typeof formSchema>) => {
    if (!canUpdateBillingData) {
      return toast.error('You do not have the required permissions to update this organization')
    }
    if (!slug) return console.error('Slug is required')

    updateCustomerProfile(
      {
        slug,
        email: values.billingEmail,
        additional_emails: values.additionalBillingEmails,
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
    if (customerProfile && !isDirty) {
      form.reset({
        billingEmail: customerProfile.email ?? '',
        additionalBillingEmails: customerProfile.additional_emails ?? [],
      })
    }
  }, [form, customerProfile, isDirty])

  return (
    <ScaffoldSection ref={ref}>
      <ScaffoldSectionDetail>
        <div className="sticky space-y-2 top-12">
          <p className="text-foreground text-base m-0">Email Recipient</p>
          <p className="text-sm text-foreground-light m-0">
            All billing correspondence will go to this email
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {isPermissionsLoaded && !canReadBillingEmail ? (
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
                      hasChanges={isDirty}
                      handleReset={form.reset}
                      disabled={!canUpdateBillingData}
                      helper={
                        !canUpdateBillingData
                          ? 'You need additional permissions to update billing emails'
                          : undefined
                      }
                    />
                  </div>
                }
              >
                <FormSection className="px-8!">
                  <FormSectionContent fullWidth loading={loadingBillingCustomer}>
                    <FormField
                      control={form.control}
                      name="billingEmail"
                      render={({ field }) => (
                        <FormItemLayout label="Email address">
                          <FormControl>
                            <Input
                              type="email"
                              {...field}
                              placeholder="Email"
                              disabled={!canUpdateBillingData}
                            />
                          </FormControl>
                          <FormMessage />
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
                            <MultiSelector
                              values={field.value}
                              onValuesChange={field.onChange}
                              disabled={!canUpdateBillingData}
                            >
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
                                {additionalEmailsError.map((_x, idx) => (
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
