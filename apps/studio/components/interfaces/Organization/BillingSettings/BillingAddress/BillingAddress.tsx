import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { FormActions } from 'components/ui/Forms/FormActions'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent } from 'components/ui/Forms/FormSection'
import NoPermission from 'components/ui/NoPermission'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { useOrganizationCustomerProfileUpdateMutation } from 'data/organizations/organization-customer-profile-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Form, Input, Listbox } from 'ui'
import { COUNTRIES } from './BillingAddress.constants'

const BillingAddress = () => {
  const { slug } = useParams()

  const canReadBillingAddress = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.customer'
  )
  const canUpdateBillingAddress = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.customer'
  )

  const { data, error, isLoading, isSuccess, isError } = useOrganizationCustomerProfileQuery(
    { slug },
    { enabled: canReadBillingAddress }
  )
  const { mutate: updateCustomerProfile, isLoading: isUpdating } =
    useOrganizationCustomerProfileUpdateMutation()

  const formId = 'billing-address-form'
  const { city, country, line1, line2, postal_code, state } = data?.address ?? {}
  const initialValues = { city, country, line1, line2, postal_code, state }

  const validate = (values: any) => {
    const errors = {} as any
    if (
      (values.line1 || values.line2 || values.postal_code || values.state || values.city) &&
      !values.country
    ) {
      errors['country'] = 'Please select a country'
    }
    if (
      (values.country || values.line2 || values.postal_code || values.state || values.city) &&
      !values.line1
    ) {
      errors['line1'] = 'Please provide an address line'
    }
    return errors
  }

  const onSubmit = async (values: any, { resetForm }: any) => {
    if (!slug) return console.error('Slug is required')

    const address = !values.line1 ? null : values

    updateCustomerProfile(
      { slug, address },
      {
        onSuccess: () => {
          toast.success('Successfully updated billing address')
          resetForm({ values, initialValues: values })
        },
      }
    )
  }

  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail>
        <div className="sticky space-y-2 top-12">
          <p className="text-foreground text-base m-0">Billing Address</p>
          <p className="text-sm text-foreground-light m-0">
            This will be reflected in every upcoming invoice, past invoices are not affected
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {!canReadBillingAddress ? (
          <NoPermission resourceText="view this organization's billing address" />
        ) : (
          <>
            {isLoading && (
              <div className="space-y-2">
                <ShimmeringLoader />
                <ShimmeringLoader className="w-3/4" />
                <ShimmeringLoader className="w-1/2" />
              </div>
            )}

            {isError && (
              <AlertError
                subject="Failed to retrieve organization customer profile"
                error={error as any}
              />
            )}

            {isSuccess && (
              <Form
                validateOnBlur
                id={formId}
                initialValues={initialValues}
                validate={validate}
                onSubmit={onSubmit}
              >
                {({ values, initialValues, handleReset, resetForm }: any) => {
                  const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

                  // eslint-disable-next-line react-hooks/rules-of-hooks
                  useEffect(() => {
                    if (isSuccess && data !== undefined) {
                      const { city, country, line1, line2, postal_code, state } =
                        data?.address ?? {}
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
                            isSubmitting={isUpdating}
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
                        <FormSectionContent fullWidth loading={false} className="!gap-2">
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
                          <div className="flex space-x-2">
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
                          <div className="flex space-x-2">
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
          </>
        )}
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}

export default BillingAddress
