import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect } from 'react'

import { useParams } from 'common'
import {
  FormActions,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import NoPermission from 'components/ui/NoPermission'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { useOrganizationCustomerProfileUpdateMutation } from 'data/organizations/organization-customer-profile-update-mutation'
import { useCheckPermissions, useStore } from 'hooks'
import { Form, Input, Listbox } from 'ui'
import { COUNTRIES } from './BillingAddress.constants'

const BillingAddress = () => {
  const { ui } = useStore()
  const { slug } = useParams()
  const { data, isLoading, isSuccess } = useOrganizationCustomerProfileQuery({ slug })
  const { mutateAsync: updateCustomerProfile } = useOrganizationCustomerProfileUpdateMutation()

  const formId = 'billing-address-form'
  const { city, country, line1, line2, postal_code, state } = data?.address ?? {}

  const canReadBillingAddress = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.customer'
  )
  const canUpdateBillingAddress = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.customer'
  )

  const initialValues = { city, country, line1, line2, postal_code, state }

  const onSubmit = async (values: any, { setSubmitting, resetForm }: any) => {
    if (!slug) return console.error('Slug is required')

    try {
      setSubmitting(true)
      await updateCustomerProfile({ slug, address: values })
      ui.setNotification({
        category: 'success',
        message: 'Successfully updated billing address',
      })
      resetForm({ values, initialValues: values })
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to update billing address: ${error.message}`,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormSection
      id="address"
      header={
        <FormSectionLabel>
          <div className="sticky top-16">
            <p className="text-base">Billing Address</p>
            <p className="text-sm text-scale-1000">This will be reflected in every invoice</p>
          </div>
        </FormSectionLabel>
      }
    >
      <FormSectionContent loading={false}>
        {!canReadBillingAddress ? (
          <NoPermission resourceText="view this organization's billing address" />
        ) : (
          <Form validateOnBlur id={formId} initialValues={initialValues} onSubmit={onSubmit}>
            {({ isSubmitting, values, initialValues, handleReset, resetForm }: any) => {
              const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

              // eslint-disable-next-line react-hooks/rules-of-hooks
              useEffect(() => {
                if (isSuccess && data !== undefined) {
                  const { city, country, line1, line2, postal_code, state } = data?.address ?? {}
                  const values = { city, country, line1, line2, postal_code, state }
                  resetForm({ values, initialValues: values })
                }

                // eslint-disable-next-line react-hooks/exhaustive-deps
              }, [isSuccess])

              return (
                <FormPanel
                  footer={
                    <div className="flex py-4 px-8">
                      <FormActions
                        form={formId}
                        isSubmitting={isSubmitting}
                        hasChanges={hasChanges}
                        handleReset={handleReset}
                        helper={
                          !canUpdateBillingAddress
                            ? "You need additional permissions to manage this organization's billing address"
                            : undefined
                        }
                      />
                    </div>
                  }
                >
                  <FormSection>
                    <FormSectionContent fullWidth loading={isLoading} className="!gap-2">
                      <Input
                        id="line1"
                        name="line1"
                        placeholder="Address line 1"
                        disabled={!canUpdateBillingAddress}
                      />
                      <Input
                        id="line2"
                        name="line2"
                        placeholder="Address line 2"
                        disabled={!canUpdateBillingAddress}
                      />
                      <div className="flex items-center space-x-2">
                        <Listbox
                          className="w-full"
                          id="country"
                          name="country"
                          placeholder="Country"
                          disabled={!canUpdateBillingAddress}
                        >
                          <Listbox.Option label="---" key="empty" value="">
                            ---
                          </Listbox.Option>
                          {COUNTRIES.map((country) => (
                            <Listbox.Option
                              label={country.name}
                              key={country.code}
                              value={country.code}
                            >
                              {country.name}
                            </Listbox.Option>
                          ))}
                        </Listbox>
                        <Input
                          className="w-full"
                          id="postal_code"
                          name="postal_code"
                          placeholder="Postal code"
                          disabled={!canUpdateBillingAddress}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          className="w-full"
                          id="city"
                          name="city"
                          placeholder="City"
                          disabled={!canUpdateBillingAddress}
                        />
                        <Input
                          className="w-full"
                          id="state"
                          name="state"
                          placeholder="State"
                          disabled={!canUpdateBillingAddress}
                        />
                      </div>
                    </FormSectionContent>
                  </FormSection>
                </FormPanel>
              )
            }}
          </Form>
        )}
      </FormSectionContent>
    </FormSection>
  )
}

export default BillingAddress
