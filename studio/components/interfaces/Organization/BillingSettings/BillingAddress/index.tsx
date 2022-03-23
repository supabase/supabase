import { FC, useState } from 'react'
import { isEqual } from 'lodash'
import { Dictionary } from '@supabase/grid'
import { Form, Input, Button, Select } from '@supabase/ui'

import { useStore } from 'hooks'
import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { COUNTRIES } from './BillingAddress.constants'
import Panel from 'components/to-be-cleaned/Panel'

interface Props {
  loading: boolean
  address: Dictionary<any>
  onAddressUpdated: (address: any) => void
}

const BillingAddress: FC<Props> = ({ loading, address, onAddressUpdated }) => {
  const { ui } = useStore()
  const orgSlug = ui.selectedOrganization?.slug ?? ''
  const { city, country, line1, line2, postal_code, state } = address

  const [isDirty, setIsDirty] = useState(false)
  const initialValues = {
    city,
    country,
    line1,
    line2,
    postal_code,
    state,
  }

  const onValidate = (values: any) => {
    const errors = {} as any
    if (isEqual(values, initialValues)) {
      setIsDirty(false)
    } else {
      setIsDirty(true)
    }
    return errors
  }

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      setSubmitting(true)
      const updatedCustomer = await patch(`${API_URL}/organizations/${orgSlug}/customer`, {
        address: values,
      })
      if (updatedCustomer.error) throw updatedCustomer.error
      ui.setNotification({
        category: 'success',
        message: 'Successfully updated billing address',
      })
      onAddressUpdated(updatedCustomer.address)
    } catch (error: any) {
      ui.setNotification({
        category: 'success',
        message: `Failed to update billing address: ${error.message}`,
      })
    } finally {
      setSubmitting(false)
      setIsDirty(false)
    }
  }

  return (
    <div className="space-y-2">
      <div>
        <h4>Billing address</h4>
        <p className="text-sm opacity-50">This will be reflected in every invoice</p>
      </div>
      <Panel loading={loading}>
        {loading ? (
          <div className="flex flex-col justify-between space-y-2 py-4 px-4">
            <div className="shimmering-loader rounded py-3 mx-1 w-2/3" />
            <div className="shimmering-loader rounded py-3 mx-1 w-1/2" />
            <div className="shimmering-loader rounded py-3 mx-1 w-1/3" />
          </div>
        ) : (
          <Form
            validateOnBlur
            initialValues={initialValues}
            validate={onValidate}
            onSubmit={onSubmit}
          >
            {({ isSubmitting, handleReset }: any) => {
              return (
                <>
                  <Panel.Content className="w-3/5 space-y-2">
                    <Input id="line1" name="line1" placeholder="Address line 1" />
                    <Input id="line2" name="line2" placeholder="Address line 2" />
                    <div className="flex items-center space-x-2">
                      <Select className="w-full" id="country" name="country" placeholder="Country">
                        <Select.Option key="empty" value="">
                          ---
                        </Select.Option>
                        {Object.keys(COUNTRIES).map((code: string) => (
                          <Select.Option key={code} value={code}>
                            {(COUNTRIES as any)[code]}
                          </Select.Option>
                        ))}
                      </Select>
                      <Input
                        className="w-full"
                        id="postal_code"
                        name="postal_code"
                        placeholder="Postal code"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input className="w-full" id="city" name="city" placeholder="City" />
                      <Input className="w-full" id="state" name="state" placeholder="State" />
                    </div>
                  </Panel.Content>
                  <div className="border-t border-scale-400" />
                  <Panel.Content>
                    <div className="flex items-center space-x-4">
                      <Button
                        type="default"
                        htmlType="reset"
                        disabled={!isDirty || isSubmitting}
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
                        loading={isSubmitting}
                        disabled={!isDirty || isSubmitting}
                      >
                        Save changes
                      </Button>
                    </div>
                  </Panel.Content>
                </>
              )
            }}
          </Form>
        )}
      </Panel>
    </div>
  )
}

export default BillingAddress
