import type { StripeAddressElementChangeEvent } from '@stripe/stripe-js'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useBillingCustomerDataForm } from '@/components/interfaces/Organization/BillingSettings/BillingCustomerData/useBillingCustomerDataForm'
import type { CustomerAddress, CustomerTaxId } from '@/data/organizations/types'

type BillingProfile = ReturnType<typeof makeCustomerProfile>
type CustomerChangeHandler = Parameters<
  typeof useBillingCustomerDataForm
>[0]['onCustomerDataChange']

type HookPropsWithTaxId = {
  customerProfile: BillingProfile
  taxId: CustomerTaxId | null
  onCustomerDataChange: CustomerChangeHandler
}

type HookPropsWithExistingTaxId = {
  customerProfile: BillingProfile
  taxId: CustomerTaxId
  onCustomerDataChange: CustomerChangeHandler
}

type HookPropsWithoutTaxId = {
  customerProfile: BillingProfile
  onCustomerDataChange: CustomerChangeHandler
}

type HookPropsHydrated = {
  customerProfile: BillingProfile | null | undefined
  onCustomerDataChange: CustomerChangeHandler
}

const makeCustomerProfile = (
  overrides?: Partial<{ address: CustomerAddress; billing_name: string }>
) => ({
  billing_name: 'Acme Inc',
  address: {
    line1: '123 Main St',
    line2: 'Suite 100',
    city: 'New York',
    state: 'NY',
    postal_code: '10001',
    country: 'US',
  },
  ...overrides,
})

const makeTaxId = (overrides?: Partial<CustomerTaxId>): CustomerTaxId => ({
  type: 'us_ein',
  value: '12-3456789',
  country: 'US',
  ...overrides,
})

const makeAddressChangeEvent = (
  overrides?: Partial<{
    name: string
    address: Partial<CustomerAddress>
    complete: boolean
  }>
): StripeAddressElementChangeEvent => ({
  complete: overrides?.complete ?? true,
  elementType: 'address',
  elementMode: 'billing',
  empty: false,
  isNewAddress: false,
  value: {
    address: {
      city: overrides?.address?.city ?? 'San Francisco',
      country: overrides?.address?.country ?? 'US',
      line1: overrides?.address?.line1 ?? '500 Market St',
      line2: overrides?.address?.line2 ?? '',
      postal_code: overrides?.address?.postal_code ?? '94105',
      state: overrides?.address?.state ?? 'CA',
    },
    name: overrides?.name ?? 'Updated Company',
  },
})

const submitHook = async <TResult,>(submit: () => Promise<TResult>) => {
  let result: TResult | undefined
  await act(async () => {
    result = await submit()
  })
  return result as TResult
}

describe('useBillingCustomerDataForm', () => {
  it('initializes tax ID fields and address country from the provided profile', () => {
    const customerProfile = makeCustomerProfile({
      address: {
        line1: '1 Infinite Loop',
        line2: '',
        city: 'Cupertino',
        state: 'CA',
        postal_code: '95014',
        country: 'US',
      },
    })
    const taxId = makeTaxId()

    const { result } = renderHook(
      ({ customerProfile, taxId, onCustomerDataChange }: HookPropsWithTaxId) =>
        useBillingCustomerDataForm({
          customerProfile,
          taxId,
          onCustomerDataChange,
        }),
      {
        initialProps: { customerProfile, taxId, onCustomerDataChange: vi.fn() },
      }
    )

    expect(result.current.addressCountry).toBe('US')
    expect(result.current.form.getValues()).toEqual({
      tax_id_name: 'US EIN',
      tax_id_type: 'us_ein',
      tax_id_value: '12-3456789',
    })
    expect(result.current.isDirty).toBe(false)
  })

  it('returns validation errors when the seeded address is incomplete', async () => {
    const customerProfile = makeCustomerProfile({
      billing_name: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
      },
    })

    const { result } = renderHook(
      ({ customerProfile, onCustomerDataChange }: HookPropsWithoutTaxId) =>
        useBillingCustomerDataForm({
          customerProfile,
          taxId: null,
          onCustomerDataChange,
        }),
      {
        initialProps: { customerProfile, onCustomerDataChange: vi.fn() },
      }
    )

    await expect(submitHook(result.current.handleSubmit)).resolves.toEqual({
      status: 'error',
      message: 'Full name is required.',
    })
  })

  it('blocks submit when Stripe marks the address element as incomplete', async () => {
    const onCustomerDataChange = vi.fn()
    const customerProfile = makeCustomerProfile()

    const { result } = renderHook(
      ({ customerProfile, onCustomerDataChange }: HookPropsWithoutTaxId) =>
        useBillingCustomerDataForm({
          customerProfile,
          taxId: null,
          onCustomerDataChange,
        }),
      {
        initialProps: { customerProfile, onCustomerDataChange },
      }
    )

    act(() => {
      result.current.onAddressChange(
        makeAddressChangeEvent({
          complete: false,
          address: { postal_code: 'ABCDE' },
        })
      )
    })

    await expect(submitHook(result.current.handleSubmit)).resolves.toEqual({
      status: 'error',
      message: 'Please enter a valid billing address.',
    })
    expect(onCustomerDataChange).not.toHaveBeenCalled()
  })

  it('submits the seeded address for tax-id-only updates', async () => {
    const onCustomerDataChange = vi.fn()
    const customerProfile = makeCustomerProfile()

    const { result } = renderHook(
      ({ customerProfile, onCustomerDataChange }: HookPropsWithoutTaxId) =>
        useBillingCustomerDataForm({
          customerProfile,
          taxId: null,
          onCustomerDataChange,
        }),
      {
        initialProps: { customerProfile, onCustomerDataChange },
      }
    )

    act(() => {
      result.current.form.setValue('tax_id_name', 'US EIN', { shouldDirty: true })
      result.current.form.setValue('tax_id_type', 'us_ein', { shouldDirty: true })
      result.current.form.setValue('tax_id_value', '12-3456789', { shouldDirty: true })
    })

    await waitFor(() => expect(result.current.isDirty).toBe(true))
    const submitResult = await submitHook(result.current.handleSubmit)
    expect(submitResult.status).toBe('success')
    if (submitResult.status !== 'success') {
      throw new Error('Expected successful submit result')
    }
    act(() => {
      result.current.markCurrentValuesAsSaved(
        submitResult.submittedState.addressValue,
        submitResult.submittedState.taxIdValues
      )
    })

    expect(onCustomerDataChange).toHaveBeenCalledWith({
      address: customerProfile.address,
      billing_name: 'Acme Inc',
      tax_id: {
        type: 'us_ein',
        value: '12-3456789',
        country: 'US',
      },
    })
    expect(result.current.isDirty).toBe(false)
  })

  it('submits tax_id as null after an existing tax ID is removed', async () => {
    const onCustomerDataChange = vi.fn()
    const customerProfile = makeCustomerProfile()
    const taxId = makeTaxId()

    const { result } = renderHook(
      ({ customerProfile, taxId, onCustomerDataChange }: HookPropsWithTaxId) =>
        useBillingCustomerDataForm({
          customerProfile,
          taxId,
          onCustomerDataChange,
        }),
      {
        initialProps: { customerProfile, taxId, onCustomerDataChange },
      }
    )

    act(() => {
      result.current.form.setValue('tax_id_name', '', { shouldDirty: true })
      result.current.form.setValue('tax_id_type', '', { shouldDirty: true })
      result.current.form.setValue('tax_id_value', '', { shouldDirty: true })
    })

    await waitFor(() => expect(result.current.isDirty).toBe(true))
    const submitResult = await submitHook(result.current.handleSubmit)
    expect(submitResult).toEqual({
      status: 'success',
      submittedState: {
        addressValue: {
          name: 'Acme Inc',
          address: customerProfile.address,
        },
        taxIdValues: {
          tax_id_name: '',
          tax_id_type: '',
          tax_id_value: '',
        },
      },
    })

    expect(onCustomerDataChange).toHaveBeenCalledWith({
      address: customerProfile.address,
      billing_name: 'Acme Inc',
      tax_id: null,
    })
  })

  it('keeps a removed tax ID cleared after an intermediate rerender during save', async () => {
    const customerProfile = makeCustomerProfile()
    const taxId = makeTaxId()
    let rerenderHook: ((props: HookPropsWithExistingTaxId) => void) | undefined

    const onCustomerDataChange: CustomerChangeHandler = vi.fn(async () => {
      rerenderHook?.({
        customerProfile: makeCustomerProfile({
          address: {
            ...customerProfile.address,
            line1: '500 Market St',
          },
        }),
        taxId,
        onCustomerDataChange,
      })
      await Promise.resolve()
    })

    const { result, rerender } = renderHook(
      ({ customerProfile, taxId, onCustomerDataChange }: HookPropsWithTaxId) =>
        useBillingCustomerDataForm({
          customerProfile,
          taxId,
          onCustomerDataChange,
        }),
      {
        initialProps: { customerProfile, taxId, onCustomerDataChange },
      }
    )

    rerenderHook = rerender

    act(() => {
      result.current.form.setValue('tax_id_name', '', { shouldDirty: true })
      result.current.form.setValue('tax_id_type', '', { shouldDirty: true })
      result.current.form.setValue('tax_id_value', '', { shouldDirty: true })
    })

    const submitResult = await submitHook(result.current.handleSubmit)
    expect(submitResult.status).toBe('success')
    if (submitResult.status !== 'success') {
      throw new Error('Expected successful submit result')
    }

    act(() => {
      result.current.markCurrentValuesAsSaved(
        submitResult.submittedState.addressValue,
        submitResult.submittedState.taxIdValues
      )
    })

    expect(result.current.form.getValues()).toEqual({
      tax_id_name: '',
      tax_id_type: '',
      tax_id_value: '',
    })
  })

  it('uses the latest address element value when building the submit payload', async () => {
    const onCustomerDataChange = vi.fn()
    const customerProfile = makeCustomerProfile()
    const taxId = makeTaxId({ type: 'eu_vat', value: '12345678', country: 'AT' })

    const { result } = renderHook(
      ({ customerProfile, taxId, onCustomerDataChange }: HookPropsWithTaxId) =>
        useBillingCustomerDataForm({
          customerProfile,
          taxId,
          onCustomerDataChange,
        }),
      {
        initialProps: { customerProfile, taxId, onCustomerDataChange },
      }
    )

    act(() => {
      result.current.onAddressChange(
        makeAddressChangeEvent({
          name: 'Updated GmbH',
          address: { country: 'AT', city: 'Vienna', postal_code: '1010' },
        })
      )
      result.current.form.setValue('tax_id_name', 'AT VAT', { shouldDirty: true })
      result.current.form.setValue('tax_id_type', 'eu_vat', { shouldDirty: true })
      result.current.form.setValue('tax_id_value', '12345678', { shouldDirty: true })
    })

    await waitFor(() => expect(result.current.addressCountry).toBe('AT'))
    const submitResult = await submitHook(result.current.handleSubmit)
    expect(submitResult).toEqual({
      status: 'success',
      submittedState: {
        addressValue: {
          name: 'Updated GmbH',
          address: {
            line1: '500 Market St',
            line2: '',
            city: 'Vienna',
            state: 'CA',
            postal_code: '1010',
            country: 'AT',
          },
        },
        taxIdValues: {
          tax_id_name: 'AT VAT',
          tax_id_type: 'eu_vat',
          tax_id_value: '12345678',
        },
      },
    })

    expect(onCustomerDataChange).toHaveBeenCalledWith({
      address: {
        line1: '500 Market St',
        line2: undefined,
        city: 'Vienna',
        state: 'CA',
        postal_code: '1010',
        country: 'AT',
      },
      billing_name: 'Updated GmbH',
      tax_id: {
        type: 'eu_vat',
        value: 'ATU12345678',
        country: 'AT',
      },
    })
  })

  it('submits an updated address without changing a missing tax ID', async () => {
    const onCustomerDataChange = vi.fn()
    const customerProfile = makeCustomerProfile()

    const { result } = renderHook(
      ({ customerProfile, onCustomerDataChange }: HookPropsWithoutTaxId) =>
        useBillingCustomerDataForm({
          customerProfile,
          taxId: null,
          onCustomerDataChange,
        }),
      {
        initialProps: { customerProfile, onCustomerDataChange },
      }
    )

    act(() => {
      result.current.onAddressChange(
        makeAddressChangeEvent({
          name: 'Updated Company',
          address: { city: 'Los Angeles', state: 'CA', postal_code: '90001' },
        })
      )
    })

    expect(result.current.isDirty).toBe(true)
    const submitResult = await submitHook(result.current.handleSubmit)
    expect(submitResult).toEqual({
      status: 'success',
      submittedState: {
        addressValue: {
          name: 'Updated Company',
          address: {
            line1: '500 Market St',
            line2: '',
            city: 'Los Angeles',
            state: 'CA',
            postal_code: '90001',
            country: 'US',
          },
        },
        taxIdValues: {
          tax_id_name: '',
          tax_id_type: '',
          tax_id_value: '',
        },
      },
    })

    expect(onCustomerDataChange).toHaveBeenCalledWith({
      address: {
        line1: '500 Market St',
        line2: undefined,
        city: 'Los Angeles',
        state: 'CA',
        postal_code: '90001',
        country: 'US',
      },
      billing_name: 'Updated Company',
      tax_id: null,
    })
  })

  it('resets dirty state and restores the initial address payload', async () => {
    const onCustomerDataChange = vi.fn()
    const customerProfile = makeCustomerProfile()

    const { result } = renderHook(
      ({ customerProfile, onCustomerDataChange }: HookPropsWithoutTaxId) =>
        useBillingCustomerDataForm({
          customerProfile,
          taxId: null,
          onCustomerDataChange,
        }),
      {
        initialProps: { customerProfile, onCustomerDataChange },
      }
    )

    act(() => {
      result.current.onAddressChange(
        makeAddressChangeEvent({
          address: { city: 'Los Angeles', state: 'CA', postal_code: '90001' },
        })
      )
      result.current.form.setValue('tax_id_name', 'US EIN', { shouldDirty: true })
      result.current.form.setValue('tax_id_type', 'us_ein', { shouldDirty: true })
      result.current.form.setValue('tax_id_value', '12-3456789', { shouldDirty: true })
    })

    await waitFor(() => expect(result.current.isDirty).toBe(true))

    act(() => {
      result.current.handleReset()
    })

    expect(result.current.isDirty).toBe(false)
    expect(result.current.addressCountry).toBe('US')

    act(() => {
      result.current.form.setValue('tax_id_name', 'US EIN', { shouldDirty: true })
      result.current.form.setValue('tax_id_type', 'us_ein', { shouldDirty: true })
      result.current.form.setValue('tax_id_value', '12-3456789', { shouldDirty: true })
    })

    const submitResult = await submitHook(result.current.handleSubmit)
    expect(submitResult).toEqual({
      status: 'success',
      submittedState: {
        addressValue: {
          name: 'Acme Inc',
          address: customerProfile.address,
        },
        taxIdValues: {
          tax_id_name: 'US EIN',
          tax_id_type: 'us_ein',
          tax_id_value: '12-3456789',
        },
      },
    })

    expect(onCustomerDataChange).toHaveBeenLastCalledWith({
      address: customerProfile.address,
      billing_name: 'Acme Inc',
      tax_id: {
        type: 'us_ein',
        value: '12-3456789',
        country: 'US',
      },
    })
  })

  it('syncs addressCountry when the customer profile loads after mount', async () => {
    const onCustomerDataChange = vi.fn<CustomerChangeHandler>()
    const initialProps: HookPropsHydrated = {
      customerProfile: undefined,
      onCustomerDataChange,
    }

    const { result, rerender } = renderHook(
      ({ customerProfile, onCustomerDataChange }: HookPropsHydrated) =>
        useBillingCustomerDataForm({
          customerProfile,
          taxId: null,
          onCustomerDataChange,
        }),
      {
        initialProps,
      }
    )

    expect(result.current.addressCountry).toBeUndefined()

    rerender({
      onCustomerDataChange,
      customerProfile: makeCustomerProfile({
        address: {
          line1: 'Schonhauser Allee 1',
          line2: '',
          city: 'Berlin',
          state: 'BE',
          postal_code: '10119',
          country: 'DE',
        },
      }),
    })

    await waitFor(() => expect(result.current.addressCountry).toBe('DE'))
  })
})
