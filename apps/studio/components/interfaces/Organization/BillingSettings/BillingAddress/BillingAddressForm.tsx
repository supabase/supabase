import { toast } from 'sonner'
import { useParams } from 'common'
import { useEffect } from 'react'

import { FormActions } from 'components/ui/Forms/FormActions'
import { FormPanel, FormPanelHeader } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent } from 'components/ui/Forms/FormSection'
import { useOrganizationCustomerProfileUpdateMutation } from 'data/organizations/organization-customer-profile-update-mutation'
import { Form, Input, Listbox } from 'ui'
import { COUNTRIES } from './BillingAddress.constants'

interface BillingAddressFormProps {
  address?: {
    city?: string
    country?: string
    line1?: string
    line2?: string
    postal_code?: string
    state?: string
  }
  onClose?: () => void
  insideDialog?: boolean
  disabled?: boolean
  formId?: string
}

const BillingAddressForm = ({
  address,
  onClose,
  insideDialog = false,
  disabled = false,
  formId = 'billing-address-form',
}: BillingAddressFormProps) => {
  const { slug } = useParams()
  const { mutate: updateCustomerProfile, isLoading: isUpdating } =
    useOrganizationCustomerProfileUpdateMutation()

  const { city, country, line1, line2, postal_code, state } = address ?? {}
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
          if (onClose && insideDialog) onClose()
        },
      }
    )
  }

  return (
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
          if (address !== undefined) {
            const { city, country, line1, line2, postal_code, state } = address ?? {}
            const values = { city, country, line1, line2, postal_code, state }
            resetForm({ values, initialValues: values })
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [address])

        return (
          <FormPanel
            footer={
              <div className="flex py-4 px-8">
                <FormActions
                  form={formId}
                  isSubmitting={isUpdating}
                  hasChanges={insideDialog ? true : hasChanges}
                  handleReset={insideDialog ? onClose : handleReset}
                  helper={
                    disabled
                      ? "You need additional permissions to manage this organization's billing address"
                      : undefined
                  }
                />
              </div>
            }
          >
            {insideDialog && (
              <FormPanelHeader>
                <h2>Billing Address</h2>
                <p className="text-sm text-foreground-light">
                  This will be reflected in every upcoming invoice, past invoices are not affected
                </p>
              </FormPanelHeader>
            )}
            <FormSection>
              <FormSectionContent fullWidth loading={false} className="!gap-2">
                <Input id="line1" name="line1" placeholder="Address line 1" disabled={disabled} />
                <Input id="line2" name="line2" placeholder="Address line 2" disabled={disabled} />
                <div className="flex space-x-2">
                  <Listbox
                    className="w-full"
                    id="country"
                    name="country"
                    placeholder="Country"
                    disabled={disabled}
                  >
                    <Listbox.Option label="---" key="empty" value="">
                      ---
                    </Listbox.Option>
                    {COUNTRIES.map((country) => (
                      <Listbox.Option label={country.name} key={country.code} value={country.code}>
                        {country.name}
                      </Listbox.Option>
                    ))}
                  </Listbox>
                  <Input
                    className="w-full"
                    id="postal_code"
                    name="postal_code"
                    placeholder="Postal code"
                    disabled={disabled}
                  />
                </div>
                <div className="flex space-x-2">
                  <Input
                    className="w-full"
                    id="city"
                    name="city"
                    placeholder="City"
                    disabled={disabled}
                  />
                  <Input
                    className="w-full"
                    id="state"
                    name="state"
                    placeholder="State"
                    disabled={disabled}
                  />
                </div>
              </FormSectionContent>
            </FormSection>
          </FormPanel>
        )
      }}
    </Form>
  )
}

export default BillingAddressForm
