import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { isEqual } from 'lodash'
import { useState } from 'react'
import { Button, Form, Input, Listbox } from 'ui'

import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import Panel from 'components/ui/Panel'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { useOrganizationCustomerProfileUpdateMutation } from 'data/organizations/organization-customer-profile-update-mutation'
import { useCheckPermissions, useStore } from 'hooks'
import { COUNTRIES } from './BillingAddress.constants'

const BillingAddress = () => {
  const { ui } = useStore()
  const { slug } = useParams()

  const {
    data: customer,
    error: customerError,
    isError: isErrorCustomer,
    isLoading: isLoadingCustomer,
    isSuccess: isSuccessCustomer,
  } = useOrganizationCustomerProfileQuery({ slug })

  const { city, country, line1, line2, postal_code, state } = customer?.address ?? {}
  const [isDirty, setIsDirty] = useState(false)
  const initialValues = { city, country, line1, line2, postal_code, state }

  const { mutate: updateCustomer, isLoading: isUpdating } =
    useOrganizationCustomerProfileUpdateMutation({
      onSuccess: () => {
        ui.setNotification({
          category: 'success',
          message: 'Successfully updated billing address',
        })
        setIsDirty(false)
      },
      onError: (error) => {
        ui.setNotification({
          category: 'error',
          message: `Failed to update billing address: ${error.message}`,
        })
      },
    })

  const canReadBillingAddress = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.customer'
  )
  const canUpdateBillingAddress = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.customer'
  )

  const onValidate = (values: any) => {
    const errors = {} as any
    if (
      (values.line1 || values.line2 || values.postal_code || values.state || values.city) &&
      !values.country
    ) {
      errors['country'] = 'Please select a country'
    }
    if (isEqual(values, initialValues)) {
      setIsDirty(false)
    } else {
      setIsDirty(true)
    }
    return errors
  }

  const onSubmit = async (values: any) => {
    if (!slug) return console.error('Slug is required')
    updateCustomer({ slug, address: values })
  }

  return (
    <div className="space-y-2">
      <div>
        <h4>Billing address</h4>
        <p className="text-sm opacity-50">This will be reflected in every invoice</p>
      </div>

      {isLoadingCustomer && <GenericSkeletonLoader />}

      {isErrorCustomer && (
        <AlertError error={customerError} subject="Failed to retrieve customer profile" />
      )}

      {isSuccessCustomer && (
        <Panel>
          {!canReadBillingAddress ? (
            <NoPermission resourceText="view this organization's billing address" />
          ) : (
            <Form
              validateOnBlur
              initialValues={initialValues}
              validate={onValidate}
              onSubmit={onSubmit}
            >
              {({ handleReset }: any) => {
                return (
                  <>
                    <Panel.Content className="w-3/5 space-y-2">
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
                    </Panel.Content>
                    <div className="border-t border-scale-400" />
                    <Panel.Content className="flex justify-between">
                      {!canUpdateBillingAddress ? (
                        <p className="text-sm text-scale-1000">
                          You need additional permissions to update this organization's billing
                          address
                        </p>
                      ) : (
                        <div />
                      )}
                      <div className="flex items-center space-x-2">
                        <Button
                          type="default"
                          htmlType="reset"
                          disabled={!isDirty || isUpdating || !canUpdateBillingAddress}
                          onClick={() => {
                            handleReset()
                            setIsDirty(false)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={isUpdating}
                          disabled={!isDirty || isUpdating || !canUpdateBillingAddress}
                        >
                          Save
                        </Button>
                      </div>
                    </Panel.Content>
                  </>
                )
              }}
            </Form>
          )}
        </Panel>
      )}
    </div>
  )
}

export default BillingAddress
